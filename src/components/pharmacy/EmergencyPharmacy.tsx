import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  History,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import type { StockTransaction } from '../../types';

export const EmergencyPharmacy: React.FC = () => {
  const { pharmacy, pharmacyTransactions, adjustPharmacyStock } = useOperations();

  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Adjustment / Restock Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'RESTOCK' | 'ADJUST'>('ADJUST');
  const [selectedDrugId, setSelectedDrugId] = useState(pharmacy[0]?.id || '');
  const [quantityInput, setQuantityInput] = useState<number>(5);
  const [reasonInput, setReasonInput] = useState<StockTransaction['reason']>('WARD_REQUISITION');
  const [actorInput, setActorInput] = useState('Pharmacist on Duty');
  const [notesInput, setNotesInput] = useState('Routine ward replenishment');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const categories: { label: string; value: string }[] = [
    { label: 'All Drug Categories', value: 'ALL' },
    { label: 'Emergency Injections', value: 'EMERGENCY_INJECTIONS' },
    { label: 'Cardiac Support', value: 'CARDIAC_SUPPORT' },
    { label: 'IV Fluids', value: 'IV_FLUIDS' },
    { label: 'Respiratory Drugs', value: 'RESPIRATORY' },
  ];

  const filteredItems = pharmacy.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.storageLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = pharmacy.filter((p) => p.status === 'LOW_STOCK').length;
  const criticalCount = pharmacy.filter((p) => p.status === 'CRITICAL').length;

  const handleOpenModal = (mode: 'RESTOCK' | 'ADJUST', drugId?: string) => {
    setModalMode(mode);
    if (drugId) setSelectedDrugId(drugId);
    setQuantityInput(mode === 'RESTOCK' ? 25 : 2);
    setReasonInput(mode === 'RESTOCK' ? 'RESTOCK_DELIVERY' : 'EMERGENCY_DISPENSE');
    setNotesInput(mode === 'RESTOCK' ? 'Replenishment order received' : 'Crash cart replenishment');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const delta = modalMode === 'RESTOCK' ? Math.abs(quantityInput) : -Math.abs(quantityInput);

    const res = adjustPharmacyStock(
      selectedDrugId,
      delta,
      reasonInput,
      actorInput.trim() || 'Pharmacist',
      notesInput.trim()
    );

    if (!res.success) {
      setFormError(res.error || 'Failed to adjust stock.');
      return;
    }

    setFormSuccess(`Stock successfully updated. Current balance: ${res.newStock}.`);
    setTimeout(() => {
      setIsModalOpen(false);
      setFormSuccess(null);
    }, 1200);
  };

  return (
    <div className="pharmacy-workspace-page">
      {/* Top Inventory Status Summary Strip */}
      <div className="pharmacy-summary-banner">
        <div className="pharm-stat-box">
          <span className="pharm-stat-label">Total Formulary Lines</span>
          <strong className="pharm-stat-val text-navy">{pharmacy.length} items</strong>
        </div>
        <div className="pharm-stat-divider" />
        <div className="pharm-stat-box">
          <span className="pharm-stat-label">Critical Shortage (&lt;50% Par)</span>
          <strong className={`pharm-stat-val ${criticalCount > 0 ? 'text-red' : 'text-slate'}`}>
            {criticalCount} critical
          </strong>
        </div>
        <div className="pharm-stat-divider" />
        <div className="pharm-stat-box">
          <span className="pharm-stat-label">Low Stock (At Par)</span>
          <strong className={`pharm-stat-val ${lowStockCount > 0 ? 'text-amber' : 'text-slate'}`}>
            {lowStockCount} items
          </strong>
        </div>
        <div className="pharm-stat-divider" />
        <div className="pharm-stat-box">
          <span className="pharm-stat-label">Inventory Safety Protocol</span>
          <span className="safety-guarantee-pill">
            <CheckCircle2 size={13} /> Strict Non-Negative Stock Validation
          </span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="workspace-toolbar-card">
        <div className="toolbar-left">
          <div className="toolbar-tab-group">
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'inventory' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Boxes size={16} />
              <span>Emergency Stock Matrix ({filteredItems.length})</span>
            </button>
            <button
              type="button"
              className={`toolbar-tab ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} />
              <span>Transaction Audit Log ({pharmacyTransactions.length})</span>
            </button>
          </div>

          <div className="toolbar-filter-box">
            <Filter size={15} className="text-slate" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="toolbar-select"
              aria-label="Filter by category"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-search-box">
            <Search size={15} className="text-slate" />
            <input
              type="text"
              placeholder="Search drug name or rack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="toolbar-search-input"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleOpenModal('ADJUST')}
          >
            <ArrowDownRight size={15} />
            <span>Dispense / Adjust</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenModal('RESTOCK')}
          >
            <ArrowUpRight size={15} />
            <span>+ Restock Batch</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="ops-card">
          <div className="table-responsive">
            <table className="enterprise-data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Medication & Strength</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Safe Threshold</th>
                  <th>Storage Location</th>
                  <th>Batch / Expiry</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isCritical = item.status === 'CRITICAL';
                  const isLow = item.status === 'LOW_STOCK';

                  return (
                    <tr key={item.id} className={isCritical ? 'row-critical-stock' : ''}>
                      <td>
                        <StatusBadge
                          label={item.status.replace('_', ' ')}
                          tone={isCritical ? 'red' : isLow ? 'amber' : 'green'}
                          size="sm"
                        />
                      </td>
                      <td>
                        <strong className="table-cell-title">{item.name}</strong>
                        <span className="table-cell-subtitle">{item.id}</span>
                      </td>
                      <td>
                        <span className="dept-tag">{item.category.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <strong className={`stock-number ${isCritical ? 'text-red' : isLow ? 'text-amber' : 'text-navy'}`}>
                          {item.currentStock} {item.unit}
                        </strong>
                      </td>
                      <td>
                        <span className="text-slate font-medium">{item.minThreshold} {item.unit}</span>
                      </td>
                      <td>
                        <span className="storage-loc-tag">{item.storageLocation}</span>
                      </td>
                      <td>
                        <div className="batch-box">
                          <span className="batch-ref">{item.batchNumber}</span>
                          <span className="batch-exp">Exp: {item.expiryDate}</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="row-action-btns">
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleOpenModal('ADJUST', item.id)}
                            title="Dispense from stock"
                          >
                            Dispense
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleOpenModal('RESTOCK', item.id)}
                            title="Restock batch"
                          >
                            Restock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transaction History Log */}
      {activeTab === 'history' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Stock Transaction Audit Trail</h3>
              <p className="section-desc">
                Immutable ledger of receipts, emergency dispatches, and adjustments with verified actors.
              </p>
            </div>
            <span className="audit-source-pill">Audit Trail Verified</span>
          </div>

          <div className="table-responsive">
            <table className="enterprise-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Medication</th>
                  <th>Operation Delta</th>
                  <th>Balance Transition</th>
                  <th>Reason Category</th>
                  <th>Authorized Actor</th>
                  <th>Clinical Notes</th>
                </tr>
              </thead>
              <tbody>
                {pharmacyTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className="font-mono text-slate text-sm">{tx.timestamp}</span>
                    </td>
                    <td>
                      <strong>{tx.drugName}</strong>
                    </td>
                    <td>
                      <span className={`delta-tag ${tx.changeDelta > 0 ? 'delta-positive' : 'delta-negative'}`}>
                        {tx.changeDelta > 0 ? `+${tx.changeDelta}` : tx.changeDelta}
                      </span>
                    </td>
                    <td>
                      <span className="balance-transition">
                        {tx.previousStock} → <strong>{tx.newStock}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="dept-tag">{tx.reason.replace(/_/g, ' ')}</span>
                    </td>
                    <td>{tx.actor}</td>
                    <td>
                      <span className="tx-notes">{tx.notes || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment & Restock Modal */}
      {isModalOpen && (
        <div className="search-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="booking-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Boxes size={20} className={modalMode === 'RESTOCK' ? 'text-emerald' : 'text-amber'} />
                <h3>{modalMode === 'RESTOCK' ? 'Restock Medication Batch' : 'Dispense / Adjust Stock'}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Medication</label>
                <select
                  value={selectedDrugId}
                  onChange={(e) => setSelectedDrugId(e.target.value)}
                  className="form-control"
                  required
                >
                  {pharmacy.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.currentStock} {p.unit}) — {p.storageLocation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {modalMode === 'RESTOCK' ? 'Units to Add (+)' : 'Units to Dispense (-)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="form-control"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(Math.max(1, Number(e.target.value)))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Reason</label>
                  <select
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value as any)}
                    className="form-control"
                  >
                    {modalMode === 'RESTOCK' ? (
                      <>
                        <option value="RESTOCK_DELIVERY">Consignment / Warehouse Receipt</option>
                        <option value="ROUTINE_CYCLE_COUNT">Cycle Count Correction</option>
                      </>
                    ) : (
                      <>
                        <option value="EMERGENCY_DISPENSE">Acute Emergency Dispense</option>
                        <option value="WARD_REQUISITION">Ward / OT Requisition</option>
                        <option value="DAMAGED_DISPOSAL">Damaged / Expired Disposal</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Authorized Staff Identifier</label>
                <input
                  type="text"
                  className="form-control"
                  value={actorInput}
                  onChange={(e) => setActorInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Operational Notes / Requisition Ref</label>
                <input
                  type="text"
                  className="form-control"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  required
                />
              </div>

              {formError && (
                <div className="inline-alert alert-error" role="alert">
                  <AlertTriangle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="inline-alert alert-success" role="status">
                  <CheckCircle2 size={18} />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${modalMode === 'RESTOCK' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Confirm {modalMode === 'RESTOCK' ? 'Restock Receipt' : 'Dispensing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
