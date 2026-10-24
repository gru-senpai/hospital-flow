import React from 'react';
import {
  Bed,
  FlaskConical,
  Wrench,
  HeartPulse,
  Boxes,
  UserCheck,
  Users,
  BellRing,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import type { AppRoute } from '../../types';

interface OperationsDashboardProps {
  onNavigate: (route: AppRoute) => void;
  onOpenCreateCase: () => void;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  onNavigate,
  onOpenCreateCase,
}) => {
  const { cases } = useHospitalFlow();
  const {
    labs,
    labReservations,
    equipment,
    pharmacy,
    traumaBays,
    doctors,
    staff,
    alerts,
    acknowledgeAlert,
    lastSyncTime,
  } = useOperations();

  // 1. Bed metrics
  const totalBeds = 42; // Ward capacity benchmark
  const readyBeds = cases.filter((c) => c.status === 'BED_READY').length;
  const cleaningBeds = cases.filter((c) => c.status === 'CLEANING_IN_PROGRESS').length;
  const awaitingReviewBeds = cases.filter((c) => c.status === 'AWAITING_REVIEW').length;
  const handoffsPending = cases.filter((c) => c.status === 'HANDOFFS_PENDING').length;

  // 2. Lab metrics
  const avgLabUtil = Math.round(
    labs.reduce((acc, l) => acc + l.utilizationRate, 0) / (labs.length || 1)
  );
  const activeLabBookings = labReservations.filter((r) => r.status === 'RUNNING' || r.status === 'SCHEDULED').length;

  // 3. Equipment metrics
  const totalEquipment = equipment.length;
  const onlineEquipment = equipment.filter((e) => e.status === 'OPERATIONAL' || e.status === 'IN_USE').length;
  const maintenanceEquipment = equipment.filter((e) => e.status === 'MAINTENANCE_DUE' || e.status === 'OUT_OF_SERVICE').length;

  // 4. Trauma bays
  const totalBays = traumaBays.length;
  const readyBays = traumaBays.filter((b) => b.status === 'READY').length;
  const inUseBays = traumaBays.filter((b) => b.status === 'IN_USE').length;

  // 5. Pharmacy low stock
  const lowStockDrugs = pharmacy.filter((p) => p.status === 'CRITICAL' || p.status === 'LOW_STOCK');
  const criticalDrugsCount = pharmacy.filter((p) => p.status === 'CRITICAL').length;

  // 6. Doctors on duty
  const onDutyDoctors = doctors.filter((d) => d.status === 'ON_DUTY' || d.status === 'IN_SURGERY').length;
  const requiredDoctors = 8; // Planned morning shift quota

  // 7. Staff coverage
  const availableStaff = staff.filter((s) => s.status === 'AVAILABLE' || s.status === 'ASSIGNED').length;
  const plannedStaff = staff.length;
  const staffCoveragePercent = Math.round((availableStaff / (plannedStaff || 1)) * 100);

  // 8. Alerts
  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');

  // Combined recent operational activity (from cases, alerts)
  const recentEvents = cases
    .flatMap((c) => c.events.map((e) => ({ ...e, ward: c.ward, bed: c.bed })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="operations-dashboard-root">
      {/* Top Banner Notice: Operational Safe Context */}
      <div className="dashboard-subbar">
        <div className="subbar-left">
          <span className="live-pulse-badge">COMMAND CENTER ACTIVE</span>
          <span className="subbar-divider">•</span>
          <span className="subbar-text">All Metrics Real-Time Synchronized across 9 Clinical Workflows</span>
        </div>
        <div className="subbar-right">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenCreateCase}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            + Initiate Bed Case
          </button>
          <Clock size={14} />
          <span>Last full node check: {lastSyncTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 8 Core Summary Metric Cards */}
      <section className="dashboard-metrics-grid" aria-label="Key Operational Performance Metrics">
        <MetricCard
          label="Beds Ready / Total"
          value={readyBeds}
          subValue={`${totalBeds}`}
          subtext={`${readyBeds} AI verified • ${awaitingReviewBeds} camera queued • ${cleaningBeds} sanitizing`}
          icon={Bed}
          tone="teal"
          trend={{ direction: 'up', text: `${readyBeds} AI confirmed` }}
          onClick={() => onNavigate('beds')}
        />

        <MetricCard
          label="Lab Utilization"
          value={`${avgLabUtil}%`}
          subtext={`${activeLabBookings} active diagnostic queues`}
          icon={FlaskConical}
          tone="blue"
          trend={{ direction: 'neutral', text: 'All 5 analyzers online' }}
          onClick={() => onNavigate('labs')}
        />

        <MetricCard
          label="Equipment Online"
          value={onlineEquipment}
          subValue={`${totalEquipment}`}
          subtext={`${maintenanceEquipment} under scheduled service`}
          icon={Wrench}
          tone="emerald"
          trend={{ direction: 'neutral', text: '95% telemetry uptime' }}
          onClick={() => onNavigate('equipment')}
        />

        <MetricCard
          label="Available Trauma Bays"
          value={readyBays}
          subValue={`${totalBays}`}
          subtext={`${inUseBays} in acute resuscitation`}
          icon={HeartPulse}
          tone={readyBays <= 1 ? 'red' : 'emerald'}
          trend={{ direction: readyBays <= 1 ? 'down' : 'neutral', text: `${readyBays} bays immediate ready` }}
          onClick={() => onNavigate('trauma')}
        />

        <MetricCard
          label="Critical Pharmacy Stock"
          value={lowStockDrugs.length}
          subtext={`${criticalDrugsCount} below emergency par buffer`}
          icon={Boxes}
          tone={criticalDrugsCount > 0 ? 'red' : 'amber'}
          trend={{ direction: criticalDrugsCount > 0 ? 'down' : 'neutral', text: 'Restock PO active' }}
          onClick={() => onNavigate('pharmacy')}
        />

        <MetricCard
          label="Doctors on Duty"
          value={onDutyDoctors}
          subValue={`${requiredDoctors}`}
          subtext="Coverage: Emergency, ICU & Trauma"
          icon={UserCheck}
          tone="purple"
          trend={{ direction: 'neutral', text: 'Shift A fulfilled' }}
          onClick={() => onNavigate('clinicians')}
        />

        <MetricCard
          label="Staff Availability"
          value={`${staffCoveragePercent}%`}
          subtext={`${availableStaff} / ${plannedStaff} active nurses & orderlies`}
          icon={Users}
          tone="blue"
          trend={{ direction: 'up', text: 'No critical shortfall' }}
          onClick={() => onNavigate('staff')}
        />

        <MetricCard
          label="Operational Alerts"
          value={activeAlerts.length}
          subtext={`${criticalAlerts.length} high priority exceptions`}
          icon={BellRing}
          tone={criticalAlerts.length > 0 ? 'red' : 'amber'}
          trend={{ direction: 'neutral', text: 'Real-time bottleneck log' }}
          onClick={() => onNavigate('alerts')}
        />
      </section>

      {/* Main Two-Column Live Status Grid */}
      <div className="dashboard-content-split">
        {/* Left Column: Live Status Overviews */}
        <div className="dashboard-main-col">
          {/* Clinic Beds & Room Turnover Health */}
          <div className="ops-card">
            <div className="ops-card-header">
              <div className="ops-header-title">
                <Bed size={18} className="text-teal" />
                <h3>Clinic Bed Turnover & Room Readiness</h3>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => onNavigate('beds')}
              >
                <span>Manage Beds</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="bed-status-breakdown-bar">
              <div
                className="breakdown-segment seg-ready"
                style={{ width: `${Math.max(10, (readyBeds / totalBeds) * 100)}%` }}
                title={`Bed Ready: ${readyBeds}`}
              >
                <span>{readyBeds} Ready</span>
              </div>
              <div
                className="breakdown-segment seg-cleaning"
                style={{ width: `${Math.max(8, (cleaningBeds / totalBeds) * 100)}%` }}
                title={`Cleaning: ${cleaningBeds}`}
              >
                <span>{cleaningBeds} Clean</span>
              </div>
              <div
                className="breakdown-segment seg-review"
                style={{ width: `${Math.max(8, (awaitingReviewBeds / totalBeds) * 100)}%` }}
                title={`AI Camera Queue: ${awaitingReviewBeds}`}
              >
                <span>{awaitingReviewBeds} AI Scan</span>
              </div>
              <div
                className="breakdown-segment seg-handoffs"
                style={{ width: `${Math.max(8, (handoffsPending / totalBeds) * 100)}%` }}
                title={`Handoffs Pending: ${handoffsPending}`}
              >
                <span>{handoffsPending} Handoff</span>
              </div>
            </div>

            <div className="bed-queue-mini-list">
              {cases.slice(0, 3).map((c) => (
                <div key={c.id} className="bed-queue-mini-row" onClick={() => onNavigate('beds')}>
                  <div className="bed-mini-identity">
                    <strong className="bed-ref">{c.caseRef}</strong>
                    <span className="bed-name">{c.ward} • {c.room} ({c.bed})</span>
                  </div>
                  <div className="bed-mini-status">
                    <StatusBadge
                      label={
                        c.status === 'BED_READY'
                          ? 'AI READY'
                          : c.status === 'AWAITING_REVIEW'
                          ? 'AI SCANNING'
                          : c.status.replace(/_/g, ' ')
                      }
                      tone={
                        c.status === 'BED_READY'
                          ? 'green'
                          : c.status === 'AWAITING_REVIEW'
                          ? 'amber'
                          : c.status === 'CLEANING_IN_PROGRESS'
                          ? 'blue'
                          : 'slate'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Equipment & Trauma Status Grid */}
          <div className="dashboard-dual-card-row">
            {/* Equipment Readiness */}
            <div className="ops-card">
              <div className="ops-card-header">
                <div className="ops-header-title">
                  <Wrench size={18} className="text-emerald" />
                  <h3>Critical Equipment Live Status</h3>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onNavigate('equipment')}
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="mini-resource-list">
                {equipment.slice(0, 4).map((eq) => (
                  <div key={eq.id} className="mini-resource-row">
                    <div className="mini-resource-info">
                      <strong>{eq.name}</strong>
                      <span>{eq.currentWard} • {eq.lastTelemetryTimestamp}</span>
                    </div>
                    <StatusBadge
                      label={eq.status.replace('_', ' ')}
                      tone={
                        eq.status === 'OPERATIONAL'
                          ? 'green'
                          : eq.status === 'IN_USE'
                          ? 'blue'
                          : eq.status === 'MAINTENANCE_DUE'
                          ? 'amber'
                          : 'red'
                      }
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Trauma Bay Overview */}
            <div className="ops-card">
              <div className="ops-card-header">
                <div className="ops-header-title">
                  <HeartPulse size={18} className="text-red" />
                  <h3>Trauma Bays Instant Readiness</h3>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => onNavigate('trauma')}
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="trauma-bays-mini-grid">
                {traumaBays.map((bay) => (
                  <div
                    key={bay.id}
                    className={`trauma-mini-tile status-${bay.status.toLowerCase()}`}
                    onClick={() => onNavigate('trauma')}
                    title={`${bay.bayNumber} - ${bay.status.replace('_', ' ')}`}
                  >
                    <span className="bay-id-label">{bay.bayNumber.replace('Trauma Bay ', 'B')}</span>
                    <span className="bay-state-label">{bay.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Diagnostic Instruments Overview */}
          <div className="ops-card">
            <div className="ops-card-header">
              <div className="ops-header-title">
                <FlaskConical size={18} className="text-blue" />
                <h3>Diagnostic Analyzers & Lab Queue</h3>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => onNavigate('labs')}
              >
                <span>Lab Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="lab-analyzers-strip">
              {labs.slice(0, 3).map((inst) => (
                <div key={inst.id} className="lab-analyzer-pill-card">
                  <div className="lab-pill-top">
                    <strong>{inst.name.split(' ')[0]} {inst.name.split(' ')[1]}</strong>
                    <StatusBadge
                      label={inst.status}
                      tone={inst.status === 'ONLINE' ? 'green' : inst.status === 'IN_USE' ? 'blue' : 'amber'}
                      size="sm"
                    />
                  </div>
                  <div className="lab-pill-metrics">
                    <span>Utilization: <strong>{inst.utilizationRate}%</strong></span>
                    <span>Queue: <strong>{inst.currentBatchQueue} tests</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Operational Timeline */}
        <div className="dashboard-side-col">
          {/* Active Operational Alerts Box */}
          <div className="ops-card alerts-summary-card">
            <div className="ops-card-header">
              <div className="ops-header-title">
                <BellRing size={18} className="text-amber" />
                <h3>Active Exception Alerts</h3>
              </div>
              <span className="badge-count-pill">{activeAlerts.length} Unresolved</span>
            </div>

            <div className="dashboard-alerts-stack">
              {activeAlerts.length === 0 ? (
                <div className="dashboard-no-alerts">
                  <CheckCircle2 size={30} className="text-emerald" />
                  <p>All hospital coordination flows operating within standard thresholds.</p>
                </div>
              ) : (
                activeAlerts.slice(0, 4).map((alt) => (
                  <div key={alt.id} className={`dash-alert-item severity-${alt.severity.toLowerCase()}`}>
                    <div className="dash-alert-top">
                      <span className="alert-badge-chip">
                        {alt.severity === 'CRITICAL' ? <AlertCircle size={13} /> : <AlertTriangle size={13} />}
                        <span>{alt.severity}</span>
                      </span>
                      <span className="dash-alert-dept">{alt.department}</span>
                    </div>
                    <strong className="dash-alert-title">{alt.title}</strong>
                    <p className="dash-alert-summary">{alt.summary}</p>
                    <div className="dash-alert-action-row">
                      {alt.status === 'NEW' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => acknowledgeAlert(alt.id)}
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => onNavigate('alerts')}
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Operations Activity Feed */}
          <div className="ops-card activity-feed-card">
            <div className="ops-card-header">
              <div className="ops-header-title">
                <Activity size={18} className="text-teal" />
                <h3>Turnaround Event Log</h3>
              </div>
              <span className="audit-source-pill">Audit Trail</span>
            </div>

            <div className="ops-activity-timeline">
              {recentEvents.map((evt) => (
                <div key={evt.id} className="activity-timeline-item">
                  <div className="timeline-marker" />
                  <div className="timeline-body">
                    <div className="timeline-header">
                      <span className="timeline-actor">{evt.actorLabel}</span>
                      <span className="timeline-time">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="timeline-summary">{evt.summary}</span>
                    <span className="timeline-case-ref">{evt.caseRef} ({evt.bed})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
