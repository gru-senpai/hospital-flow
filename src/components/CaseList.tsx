import React, { useState, useMemo } from 'react';
import { useHospitalFlow } from '../context/HospitalFlowContext';
import type { HospitalCase, CaseStatus } from '../types';
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ClipboardList,
  Flame,
  ArrowRight,
  Scan,
} from 'lucide-react';

interface CaseListProps {
  onSelectCase: (caseId: string) => void;
}

type FilterTab = 'ALL' | 'AWAITING_REVIEW' | 'IN_PROGRESS' | 'BED_READY';

export const CaseList: React.FC<CaseListProps> = ({ onSelectCase }) => {
  const { cases, activeCaseId } = useHospitalFlow();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = useMemo(() => {
    return {
      all: cases.length,
      awaitingReview: cases.filter((c) => c.status === 'AWAITING_REVIEW').length,
      inProgress: cases.filter(
        (c) =>
          c.status === 'HANDOFFS_PENDING' ||
          c.status === 'CLEANING_IN_PROGRESS' ||
          c.status === 'REJECTED_RECLEAN'
      ).length,
      bedReady: cases.filter((c) => c.status === 'BED_READY').length,
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Tab filter
      if (activeTab === 'AWAITING_REVIEW' && c.status !== 'AWAITING_REVIEW') return false;
      if (
        activeTab === 'IN_PROGRESS' &&
        c.status !== 'HANDOFFS_PENDING' &&
        c.status !== 'CLEANING_IN_PROGRESS' &&
        c.status !== 'REJECTED_RECLEAN'
      ) {
        return false;
      }
      if (activeTab === 'BED_READY' && c.status !== 'BED_READY') return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = c.caseRef.toLowerCase().includes(query);
        const matchesWard = c.ward.toLowerCase().includes(query);
        const matchesRoom = c.room.toLowerCase().includes(query);
        const matchesBed = c.bed.toLowerCase().includes(query);
        return matchesRef || matchesWard || matchesRoom || matchesBed;
      }

      return true;
    });
  }, [cases, activeTab, searchQuery]);

  const renderStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'HANDOFFS_PENDING':
        return (
          <span className="badge badge-neutral">
            <ClipboardList className="badge-icon" />
            <span>Handoffs Pending</span>
          </span>
        );
      case 'CLEANING_IN_PROGRESS':
        return (
          <span className="badge badge-info">
            <Sparkles className="badge-icon" />
            <span>Cleaning Active</span>
          </span>
        );
      case 'AWAITING_REVIEW':
        return (
          <span className="badge badge-warning">
            <Scan className="badge-icon" />
            <span>AI Vision Scan</span>
          </span>
        );
      case 'BED_READY':
        return (
          <span className="badge badge-success">
            <CheckCircle className="badge-icon" />
            <span>AI Verified Ready</span>
          </span>
        );
      case 'REJECTED_RECLEAN':
        return (
          <span className="badge badge-danger">
            <AlertCircle className="badge-icon" />
            <span>Re-clean Requested</span>
          </span>
        );
    }
  };

  const renderPriorityBadge = (c: HospitalCase) => {
    if (c.priority === 'HIGH_TURNOVER') {
      return (
        <span className="priority-pill priority-high" title="Rapid turnover bed target">
          <Flame className="priority-icon" /> High Turnover
        </span>
      );
    }
    if (c.priority === 'URGENT') {
      return (
        <span className="priority-pill priority-urgent" title="Urgent bed assignment needed">
          Urgent
        </span>
      );
    }
    return null;
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <section className="case-list-panel" aria-label="Turnaround Cases Queue">
      {/* Header & Tabs */}
      <div className="panel-header">
        <h2 className="panel-title">Operational Bed Queue</h2>
        <div className="search-bar-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Filter by ref, ward, room, bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter cases list"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'ALL'}
          className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All ({counts.all})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'AWAITING_REVIEW'}
          className={`tab-btn ${activeTab === 'AWAITING_REVIEW' ? 'active' : ''}`}
          onClick={() => setActiveTab('AWAITING_REVIEW')}
        >
          AI Vision Queue
          {counts.awaitingReview > 0 && (
            <span className="tab-pill-alert">{counts.awaitingReview}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'IN_PROGRESS'}
          className={`tab-btn ${activeTab === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => setActiveTab('IN_PROGRESS')}
        >
          In Progress ({counts.inProgress})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'BED_READY'}
          className={`tab-btn ${activeTab === 'BED_READY' ? 'active' : ''}`}
          onClick={() => setActiveTab('BED_READY')}
        >
          Bed Ready ({counts.bedReady})
        </button>
      </div>

      {/* Case Items List */}
      <div className="case-cards-scroll">
        {filteredCases.length === 0 ? (
          <div className="empty-state">
            <ClipboardList className="empty-icon" />
            <p className="empty-title">No turnaround cases found</p>
            <p className="empty-subtext">
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'No cases match this queue filter.'}
            </p>
          </div>
        ) : (
          filteredCases.map((c) => {
            const isSelected = c.id === activeCaseId;
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                className={`case-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectCase(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCase(c.id);
                  }
                }}
                aria-label={`Case ${c.caseRef}, ${c.ward}, ${c.room}, ${c.bed}`}
              >
                <div className="case-card-top">
                  <div className="ref-and-priority">
                    <span className="case-ref">{c.caseRef}</span>
                    {renderPriorityBadge(c)}
                  </div>
                  <span className="case-time">
                    <Clock className="time-icon" />
                    {formatTimeAgo(c.createdAt)}
                  </span>
                </div>

                <div className="case-location-row">
                  <div className="location-primary">
                    <span className="ward-name">{c.ward}</span>
                    <span className="room-bed">
                      {c.room} • <strong>{c.bed}</strong>
                    </span>
                  </div>
                  <span className="bed-type-tag">{c.bedType}</span>
                </div>

                <div className="case-card-footer">
                  {renderStatusBadge(c.status)}
                  <ArrowRight className="card-arrow" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
