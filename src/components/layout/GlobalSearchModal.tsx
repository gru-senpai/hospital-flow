import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Bed, Wrench, FlaskConical, Boxes, HeartPulse, UserCheck, BellRing, ArrowRight } from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useHospitalFlow } from '../../context/HospitalFlowContext';
import type { AppRoute } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { cases } = useHospitalFlow();
  const { equipment, pharmacy, doctors, alerts } = useOperations();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search across modules
  const matchingBeds = q
    ? cases.filter((c) => c.caseRef.toLowerCase().includes(q) || c.bed.toLowerCase().includes(q) || c.ward.toLowerCase().includes(q))
    : [];

  const matchingEquipment = q
    ? equipment.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.currentWard.toLowerCase().includes(q))
    : [];

  const matchingPharmacy = q
    ? pharmacy.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.storageLocation.toLowerCase().includes(q))
    : [];

  const matchingDoctors = q
    ? doctors.filter((d) => d.doctorName.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.department.toLowerCase().includes(q))
    : [];

  const matchingAlerts = q
    ? alerts.filter((a) => a.title.toLowerCase().includes(q) || a.department.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchingBeds.length +
    matchingEquipment.length +
    matchingPharmacy.length +
    matchingDoctors.length +
    matchingAlerts.length;

  const handleSelect = (route: AppRoute) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-header">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="search-input-field"
            placeholder="Search beds, equipment, drugs, doctors, alerts... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="search-close-btn" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="search-results-container">
          {!q && (
            <div className="search-suggestions">
              <span className="search-section-label">Quick Module Navigation</span>
              <div className="search-chips-row">
                <button type="button" className="search-chip" onClick={() => handleSelect('beds')}>
                  <Bed size={15} /> Clinic Beds
                </button>
                <button type="button" className="search-chip" onClick={() => handleSelect('equipment')}>
                  <Wrench size={15} /> Equipment
                </button>
                <button type="button" className="search-chip" onClick={() => handleSelect('pharmacy')}>
                  <Boxes size={15} /> Pharmacy
                </button>
                <button type="button" className="search-chip" onClick={() => handleSelect('trauma')}>
                  <HeartPulse size={15} /> Emergency Trauma
                </button>
                <button type="button" className="search-chip" onClick={() => handleSelect('labs')}>
                  <FlaskConical size={15} /> Labs
                </button>
                <button type="button" className="search-chip" onClick={() => handleSelect('alerts')}>
                  <BellRing size={15} /> Operational Alerts
                </button>
              </div>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="search-empty-state">
              <p>No operational resources found matching "<strong>{query}</strong>"</p>
              <small>Try searching for "Ventilator", "Epi", "Ward 4B", "Dr. Priya", or "Bed"</small>
            </div>
          )}

          {matchingBeds.length > 0 && (
            <div className="search-category-group">
              <div className="search-cat-title"><Bed size={16} /> Clinic Bed Cases ({matchingBeds.length})</div>
              {matchingBeds.slice(0, 4).map((b) => (
                <div key={b.id} className="search-result-item" onClick={() => handleSelect('beds')}>
                  <div>
                    <strong>{b.caseRef} — {b.bed}</strong>
                    <span>{b.ward} • Status: {b.status.replace('_', ' ')}</span>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          )}

          {matchingEquipment.length > 0 && (
            <div className="search-category-group">
              <div className="search-cat-title"><Wrench size={16} /> Equipment ({matchingEquipment.length})</div>
              {matchingEquipment.slice(0, 4).map((eq) => (
                <div key={eq.id} className="search-result-item" onClick={() => handleSelect('equipment')}>
                  <div>
                    <strong>{eq.id} — {eq.name}</strong>
                    <span>{eq.currentWard} • Status: {eq.status.replace('_', ' ')}</span>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          )}

          {matchingPharmacy.length > 0 && (
            <div className="search-category-group">
              <div className="search-cat-title"><Boxes size={16} /> Emergency Pharmacy ({matchingPharmacy.length})</div>
              {matchingPharmacy.slice(0, 4).map((item) => (
                <div key={item.id} className="search-result-item" onClick={() => handleSelect('pharmacy')}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>Stock: {item.currentStock} {item.unit} • {item.storageLocation}</span>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          )}

          {matchingDoctors.length > 0 && (
            <div className="search-category-group">
              <div className="search-cat-title"><UserCheck size={16} /> Doctors On Roster ({matchingDoctors.length})</div>
              {matchingDoctors.slice(0, 4).map((doc) => (
                <div key={doc.id} className="search-result-item" onClick={() => handleSelect('clinicians')}>
                  <div>
                    <strong>{doc.doctorName}</strong>
                    <span>{doc.specialty} • {doc.department} • {doc.status.replace('_', ' ')}</span>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          )}

          {matchingAlerts.length > 0 && (
            <div className="search-category-group">
              <div className="search-cat-title"><BellRing size={16} /> Alerts ({matchingAlerts.length})</div>
              {matchingAlerts.slice(0, 4).map((alt) => (
                <div key={alt.id} className="search-result-item" onClick={() => handleSelect('alerts')}>
                  <div>
                    <strong>[{alt.severity}] {alt.title}</strong>
                    <span>{alt.department} • {alt.summary}</span>
                  </div>
                  <ArrowRight size={16} className="item-arrow" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
