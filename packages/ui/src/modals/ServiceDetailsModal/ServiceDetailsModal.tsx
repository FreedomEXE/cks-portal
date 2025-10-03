import React, { useEffect, useState } from 'react';
import Button from '../../buttons/Button';

export interface ServiceDetails {
  serviceId: string;
  title?: string | null;
  centerId?: string | null;
  metadata: any;
}

export interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDetails | null;
  editable?: boolean;
  onSave?: (updates: { crew?: string[]; procedures?: any[]; training?: any[] }) => void;
  availableCrew?: Array<{ code: string; name: string }>;
}

export default function ServiceDetailsModal({ isOpen, onClose, service, editable = true, onSave, availableCrew = [] }: ServiceDetailsModalProps) {
  const [crewInput, setCrewInput] = useState('');
  const [crewSelected, setCrewSelected] = useState<string[]>([]);
  const [proceduresInput, setProceduresInput] = useState('');
  const [trainingInput, setTrainingInput] = useState('');

  useEffect(() => {
    if (!isOpen || !service) return;
    const meta = service.metadata || {};
    const crewArr: string[] = Array.isArray(meta.crew) ? meta.crew : [];
    const proceduresArr: any[] = Array.isArray(meta.procedures) ? meta.procedures : [];
    const trainingArr: any[] = Array.isArray(meta.training) ? meta.training : [];
    setCrewInput(crewArr.join(', '));
    setCrewSelected(crewArr);
    setProceduresInput(proceduresArr.map((p: any) => p?.name || '').filter(Boolean).join('\n'));
    setTrainingInput(trainingArr.map((t: any) => t?.name || '').filter(Boolean).join('\n'));
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = () => {
    if (!onSave) return;
    const manual = crewInput.split(',').map(s => s.trim()).filter(Boolean);
    const crew = Array.from(new Set([...manual, ...crewSelected]));
    const procedures = proceduresInput.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    const training = trainingInput.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    onSave({ crew, procedures, training });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleBackdropClick}>
      <div style={{ backgroundColor: '#fff', borderRadius: 8, padding: 20, width: 600 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Service Details</h3>
        <div style={{ marginBottom: 12, color: '#475569' }}>Service ID: <strong>{service.serviceId}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Assigned Crew (comma-separated codes)</label>
            <input disabled={!editable} value={crewInput} onChange={e => setCrewInput(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Assign Crew (picker)</label>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 8, maxHeight: 160, overflow: 'auto' }}>
              {availableCrew.length === 0 ? (
                <div style={{ color: '#6b7280' }}>No crew in your ecosystem.</div>
              ) : (
                availableCrew.map((c) => (
                  <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 4 }}>
                    <input
                      type="checkbox"
                      disabled={!editable}
                      checked={crewSelected.includes(c.code)}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        setCrewSelected((prev) => checked ? Array.from(new Set([...prev, c.code])) : prev.filter(x => x !== c.code));
                      }}
                    />
                    <span style={{ fontSize: 14 }}>{c.name} ({c.code})</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Procedures (one per line)</label>
            <textarea disabled={!editable} value={proceduresInput} onChange={e => setProceduresInput(e.target.value)} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Training (one per line)</label>
            <textarea disabled={!editable} value={trainingInput} onChange={e => setTrainingInput(e.target.value)} rows={3} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Close</Button>
          {editable && <Button variant="primary" onClick={handleSave}>Save</Button>}
        </div>
      </div>
    </div>
  );
}
