/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Admin Hub - FULLY INDEPENDENT)
 * 
 * Description: Consolidated admin hub with complete independence from shared components
 * Function: Single-page admin interface with tabbed sections for system management
 * Importance: Critical - Central administration for all CKS Portal operations
 * Connects to: Admin API endpoints only, Admin authentication, sessionStorage
 * 
 * Notes: 100% self-contained admin hub with no external dependencies.
 *        Admin is the only non-template hub that creates data for all other hubs.
 *        Includes user creation, system management, and directory functionality.
 *        Uses black theme for administrative authority and system control.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { validateAdminRole, getAdminSession, setAdminSession, getAdminOperationalInfo } from './utils/adminAuth';
import { buildAdminApiUrl, adminApiFetch } from './utils/adminApi';

function CreateServiceCard() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/catalog/items');
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category, description, status }) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Service created');
      setName(''); setCategory(''); setDescription(''); setStatus('active');
    } catch (e) {
      setMsg('Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🔧 Create Service</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a new service to the global catalog</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Category</label>
        <input value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !name} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE SERVICE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateWarehouseCard() {
  const [warehouse_name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [manager_id, setManagerId] = useState('');
  const [warehouse_type, setType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date_acquired, setDateAcquired] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const body = { warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired: date_acquired || undefined, capacity: capacity || undefined, status };
      const r = await adminApiFetch(buildAdminApiUrl('/warehouses'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Warehouse created');
      setName(''); setAddress(''); setManagerId(''); setType(''); setPhone(''); setEmail(''); setDateAcquired(''); setCapacity(''); setStatus('active');
    } catch {
      setMsg('Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🏭 Create Warehouse</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Provision a new warehouse hub</div>
      {[
        { label: 'Name', value: warehouse_name, setter: setName },
        { label: 'Address', value: address, setter: setAddress },
        { label: 'Manager ID (MGR-XXX)', value: manager_id, setter: setManagerId },
        { label: 'Type', value: warehouse_type, setter: setType },
        { label: 'Phone', value: phone, setter: setPhone },
        { label: 'Email', value: email, setter: setEmail },
      ].map((f) => (
        <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>{f.label}</label>
          <input value={f.value as any} onChange={(e)=>f.setter(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Date Acquired</label>
        <input type="date" value={date_acquired} onChange={(e)=>setDateAcquired(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Capacity</label>
        <input type="number" value={capacity} onChange={(e)=>setCapacity(e.target.value === '' ? '' : Number(e.target.value))} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !warehouse_name} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE WAREHOUSE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

// Crew Assignment Component
function CrewAssignmentCard() {
  const [unassignedCrew, setUnassignedCrew] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [showRequirements, setShowRequirements] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [forceAssign, setForceAssign] = useState(false);

  // Load unassigned crew and centers
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [crewRes, centersRes] = await Promise.all([
          adminApiFetch(buildAdminApiUrl('/crew/unassigned')),
          adminApiFetch(buildAdminApiUrl('/centers', { limit: 100 }))
        ]);
        const [crewData, centersData] = await Promise.all([crewRes.json(), centersRes.json()]);
        setUnassignedCrew(crewData.items || []);
        setCenters(centersData.items || []);
      } catch (error) {
        setMessage('Failed to load data');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Load requirements when crew is selected
  useEffect(() => {
    if (!selectedCrew) {
      setRequirements([]);
      setShowRequirements(false);
      return;
    }
    async function loadRequirements() {
      try {
        const res = await adminApiFetch(buildAdminApiUrl(`/crew/${selectedCrew}/requirements`));
        const data = await res.json();
        setRequirements(data.items || []);
        setShowRequirements(true);
      } catch (error) {
        setRequirements([]);
      }
    }
    loadRequirements();
  }, [selectedCrew]);

  const handleAssign = async () => {
    if (!selectedCrew || !selectedCenter) {
      setMessage('Please select both crew member and center');
      return;
    }

    setAssigning(true);
    setMessage(null);
    try {
      const res = await adminApiFetch(buildAdminApiUrl(`/crew/${selectedCrew}/assign-center`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          center_id: selectedCenter,
          force_assign: forceAssign
        })
      });

      if (res.status === 400) {
        const error = await res.json();
        if (error.error_code === 'REQUIREMENTS_INCOMPLETE') {
          setMessage(`❌ Incomplete requirements (${error.requirements_status.completed}/${error.requirements_status.total}). Check "Force Assign" to override.`);
        } else {
          setMessage(`❌ ${error.error}`);
        }
        setAssigning(false);
        return;
      }

      const result = await res.json();
      setMessage(`✅ ${result.message}`);
      
      // Refresh unassigned crew list
      const crewRes = await adminApiFetch(buildAdminApiUrl('/crew/unassigned'));
      const crewData = await crewRes.json();
      setUnassignedCrew(crewData.items || []);
      
      // Reset selections
      setSelectedCrew('');
      setSelectedCenter('');
      setForceAssign(false);
      
    } catch (error) {
      setMessage('❌ Assignment failed');
    }
    setAssigning(false);
  };

  const selectedCrewData = unassignedCrew.find(c => c.crew_id === selectedCrew);
  const readinessColor = selectedCrewData?.is_ready ? '#22c55e' : '#f59e0b';

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #333333',
      borderRadius: 12,
      padding: 20,
      color: '#ffffff',
      minWidth: 400
    }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Crew → Center Assignment</div>
      <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
        Assign unassigned crew members to centers with readiness checks
      </div>

      {loading && <div style={{ color: '#888', fontSize: 14 }}>Loading...</div>}
      
      {!loading && (
        <>
          {/* Crew Selection */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#aaa' }}>
              Unassigned Crew ({unassignedCrew.length})
            </label>
            <select 
              value={selectedCrew}
              onChange={(e) => setSelectedCrew(e.target.value)}
              style={{ 
                width: '100%', 
                background: '#000', 
                color: '#fff', 
                border: '1px solid #333', 
                padding: '8px 10px', 
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">Select crew member...</option>
              {unassignedCrew.map(crew => (
                <option key={crew.crew_id} value={crew.crew_id}>
                  {crew.crew_name} ({crew.crew_id}) - {crew.readiness_score}% ready
                </option>
              ))}
            </select>
          </div>

          {/* Center Selection */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#aaa' }}>
              Target Center
            </label>
            <select 
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              style={{ 
                width: '100%', 
                background: '#000', 
                color: '#fff', 
                border: '1px solid #333', 
                padding: '8px 10px', 
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">Select center...</option>
              {centers.map(center => (
                <option key={center.center_id} value={center.center_id}>
                  {center.name || center.center_name} ({center.center_id})
                </option>
              ))}
            </select>
          </div>

          {/* Readiness Status */}
          {selectedCrewData && (
            <div style={{ 
              marginBottom: 12, 
              padding: 10, 
              background: '#0a0a0a', 
              borderRadius: 6,
              border: `1px solid ${readinessColor}20`
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Readiness Status</div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 14 
              }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: readinessColor 
                }}></div>
                <span style={{ color: readinessColor, fontWeight: 600 }}>
                  {selectedCrewData.readiness_score}% Complete
                </span>
                <span style={{ color: '#888' }}>
                  ({selectedCrewData.completed_requirements}/{selectedCrewData.total_requirements} requirements)
                </span>
              </div>
            </div>
          )}

          {/* Requirements Details */}
          {showRequirements && requirements.length > 0 && (
            <div style={{ 
              marginBottom: 12, 
              padding: 10, 
              background: '#0a0a0a', 
              borderRadius: 6,
              maxHeight: 120,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>Requirements</div>
              {requirements.map((req, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 4,
                  fontSize: 12
                }}>
                  <div style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: req.status === 'completed' ? '#22c55e' : '#f59e0b'
                  }}></div>
                  <span style={{ color: req.required ? '#fff' : '#888' }}>
                    {req.title} ({req.kind})
                  </span>
                  <span style={{ 
                    fontSize: 10,
                    color: req.status === 'completed' ? '#22c55e' : '#f59e0b',
                    textTransform: 'uppercase'
                  }}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Force Assign Override */}
          {selectedCrewData && !selectedCrewData.is_ready && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 13,
                color: '#f59e0b',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={forceAssign} 
                  onChange={(e) => setForceAssign(e.target.checked)}
                />
                Force Assign (Admin Override)
              </label>
            </div>
          )}

          {/* Assignment Button */}
          <button 
            onClick={handleAssign}
            disabled={!selectedCrew || !selectedCenter || assigning}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: selectedCrewData?.is_ready || forceAssign 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontWeight: 600,
              cursor: (!selectedCrew || !selectedCenter || assigning) ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: (!selectedCrew || !selectedCenter || assigning) ? 0.5 : 1
            }}
          >
            {assigning ? 'Assigning...' : selectedCrewData?.is_ready ? 'ASSIGN TO CENTER' : 'ASSIGN WITH OVERRIDE'}
          </button>

          {message && (
            <div style={{ 
              marginTop: 12, 
              fontSize: 13, 
              color: message.includes('✅') ? '#22c55e' : '#f59e0b',
              padding: 8,
              background: '#0a0a0a',
              borderRadius: 4
            }}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CrewCreateWizard({ payload, setPayload, onCreate, creating, message }: { payload: Record<string, any>, setPayload: React.Dispatch<React.SetStateAction<Record<string, any>>>, onCreate: () => void, creating: boolean, message: string | null }) {
  const [step, setStep] = useState(0);
  const steps = ['Identity', 'Contact', 'Employment', 'Skills & Certs', 'Emergency'];

  function setField(k: string, v: any) { setPayload(prev => ({ ...prev, [k]: v })); }
  function next() { if (step < steps.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }

  // Minimal validation per step
  const canNext = () => {
    if (step === 0) return Boolean((payload.crew_name || '').trim());
    return true;
  };

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 16, color: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <span key={s} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: i === step ? '#22c55e' : '#000', color: i === step ? '#000' : '#9ca3af', fontSize: 12, fontWeight: 700 }}>{i + 1}. {s}</span>
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Crew Name</label>
            <input value={payload.crew_name || ''} onChange={e => setField('crew_name', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>ID will be auto-generated (e.g., CRW-001) after Create.</div>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Email</label>
            <input value={payload.email || ''} onChange={e => setField('email', e.target.value)} type="email" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Phone</label>
            <input value={payload.phone || ''} onChange={e => setField('phone', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Languages</label>
            <input value={payload.languages || ''} onChange={e => setField('languages', e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Role/Position</label>
            <input value={payload.role || ''} onChange={e => setField('role', e.target.value)} placeholder="Cleaner / Technician / Supervisor" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Employment Type</label>
            <input value={payload.employment_type || ''} onChange={e => setField('employment_type', e.target.value)} placeholder="Full-time / Part-time / Contractor" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Start Date</label>
            <input value={payload.start_date || ''} onChange={e => setField('start_date', e.target.value)} placeholder="YYYY-MM-DD" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Availability</label>
            <input value={payload.availability || ''} onChange={e => setField('availability', e.target.value)} placeholder="Full-time / Weekends / Nights" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Skills</label>
            <input value={payload.skills || ''} onChange={e => setField('skills', e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Certification Level</label>
            <input value={payload.certification_level || ''} onChange={e => setField('certification_level', e.target.value)} placeholder="None / Level 1 / Level 2" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Contact Name</label>
            <input value={payload.emergency_contact_name || ''} onChange={e => setField('emergency_contact_name', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Relationship</label>
            <input value={payload.emergency_contact_relationship || ''} onChange={e => setField('emergency_contact_relationship', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Phone</label>
            <input value={payload.emergency_contact_phone || ''} onChange={e => setField('emergency_contact_phone', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Email</label>
            <input value={payload.emergency_contact_email || ''} onChange={e => setField('emergency_contact_email', e.target.value)} type="email" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button onClick={back} disabled={step === 0} style={{ padding: '8px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 6, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>Back</button>
        {step < steps.length - 1 ? (
          <button onClick={next} disabled={!canNext()} style={{ padding: '8px 12px', background: canNext() ? '#22c55e' : '#1f2937', border: 'none', color: '#000', borderRadius: 6, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed' }}>Next</button>
        ) : (
          <button onClick={onCreate} disabled={creating || !canNext()} style={{ padding: '8px 12px', background: '#22c55e', border: 'none', color: '#000', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>{creating ? 'Creating…' : 'Create Crew'}</button>
        )}
        {message && <div style={{ color: '#9ca3af', fontSize: 13 }}>{message}</div>}
      </div>
    </div>
  );
}
function CreateProcedureCard() {
  const [name, setName] = useState('');
  const [centerId, setCenterId] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/procedures');
      const body = {
        procedure_name: name,
        center_id: centerId,
        description,
        steps,
        required_skills: requiredSkills,
        status
      };
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Procedure created');
      setName(''); setCenterId(''); setDescription(''); setSteps(''); setRequiredSkills(''); setStatus('active');
    } catch { setMsg('Create failed'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>📋 Create Procedure</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a new procedure (center-specific)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Center ID</label>
        <input value={centerId} onChange={e => setCenterId(e.target.value)} placeholder="CEN-XXX" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Steps</label>
        <input value={steps} onChange={e => setSteps(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Req. Skills</label>
        <input value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !name || !centerId} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE PROCEDURE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateTrainingCard() {
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [certLevel, setCertLevel] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/training');
      const body = {
        training_name: name,
        service_id: serviceId,
        description,
        duration_hours: duration ? Number(duration) : undefined,
        certification_level: certLevel,
        requirements,
        status
      };
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Training created');
      setName(''); setServiceId(''); setDescription(''); setDuration(''); setCertLevel(''); setRequirements(''); setStatus('active');
    } catch { setMsg('Create failed'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🎓 Create Training</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a training module linked to a service</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Service ID</label>
        <input value={serviceId} onChange={e => setServiceId(e.target.value)} placeholder="SRV-XXX" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Duration (hrs)</label>
        <input value={duration} onChange={e => setDuration(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Cert Level</label>
        <input value={certLevel} onChange={e => setCertLevel(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Requirements</label>
        <input value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <button onClick={onSave} disabled={saving || !name || !serviceId} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE TRAINING'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}
import LogoutButton from './components/LogoutButton';

type AdminSection = 'dashboard' | 'directory' | 'create' | 'assign' | 'activity' | 'profile';
type DirectoryTab = 'management' | 'contractors' | 'customers' | 'centers' | 'crew' | 'services' | 'products' | 'supplies' | 'procedures' | 'training' | 'warehouses' | 'orders' | 'reports' | 'feedback';

export default function AdminHome() {
  const { user } = useUser();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<DirectoryTab>('contractors');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [directoryData, setDirectoryData] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createRole, setCreateRole] = useState<'manager'|'contractor'|'customer'|'center'|'crew'>('manager');
  const [createPayload, setCreatePayload] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Set section based on URL path
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && ['dashboard', 'directory', 'create', 'activity', 'profile'].includes(path)) {
      setActiveSection(path as AdminSection);
    }
  }, [location.pathname]);

  // Validate admin access
  if (!user || !validateAdminRole(user)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000000',
        color: '#ffffff' 
      }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Admin privileges required</div>
        </div>
      </div>
    );
  }

  // Get admin info
  const adminInfo = getAdminOperationalInfo(user);
  const adminSession = getAdminSession();
  const adminCode = adminSession.code || adminInfo.adminId || 'admin-000';
  const adminName = adminInfo.adminName || user.fullName || 'System Administrator';

  // Set admin session
  useEffect(() => {
    if (adminCode && adminName && adminInfo.adminId) {
      setAdminSession(adminCode, adminName, adminInfo.adminId);
    }
  }, [adminCode, adminName, adminInfo.adminId]);

  // Navigation sections
  const sections = [
    { id: 'dashboard', label: '🏠 Dashboard', description: 'System overview and metrics' },
    { id: 'directory', label: '📋 Directory', description: 'Search, filter, and review' },
    { id: 'create', label: '➕ Create', description: 'Create users and services' },
    { id: 'assign', label: '🔗 Assign', description: 'Link users and warehouses' },
    { id: 'activity', label: '📡 Activity', description: 'Oversight and recent events' },
    { id: 'profile', label: '👤 Profile', description: 'Admin profile settings' },
  ];

  // Sample user data for directory
  const sampleUsers = [
    { id: 'mgr-001', name: 'John Smith', email: 'john.smith@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'con-045', name: 'Sarah Johnson', email: 'sarah@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Active', lastLogin: '1 day ago' },
    { id: 'cus-123', name: 'Mike Davis', email: 'mike@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '3 hours ago' },
    { id: 'ctr-089', name: 'Lisa Wilson', email: 'lisa@center.com', role: 'Center', hub: 'Center', status: 'Active', lastLogin: '1 hour ago' },
    { id: 'crw-234', name: 'Tom Brown', email: 'tom@crew.com', role: 'Crew', hub: 'Crew', status: 'Active', lastLogin: '30 min ago' },
    { id: 'mgr-002', name: 'Jennifer Lee', email: 'jennifer@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '4 hours ago' },
    { id: 'con-046', name: 'Robert Chen', email: 'robert@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Inactive', lastLogin: '2 weeks ago' },
    { id: 'cus-124', name: 'Amy Taylor', email: 'amy@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '1 day ago' },
  ];

  // Filter users based on search term
  const filteredUsers = sampleUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Directory tab configurations - ORDERED BY CHAIN OF COMMAND
  const directoryTabs = [
    { key: 'contractors' as DirectoryTab, label: 'Contractors', color: '#10b981', icon: '🏢' },
    { key: 'management' as DirectoryTab, label: 'Managers', color: '#3b82f6', icon: '👨‍💼' },
    { key: 'customers' as DirectoryTab, label: 'Customers', color: '#eab308', icon: '🎯' },
    { key: 'centers' as DirectoryTab, label: 'Centers', color: '#f97316', icon: '🏬' },
    { key: 'crew' as DirectoryTab, label: 'Crew', color: '#ef4444', icon: '👷' },
    { key: 'services' as DirectoryTab, label: 'Services', color: '#8b5cf6', icon: '🔧' },
    { key: 'products' as DirectoryTab, label: 'Products', color: '#ec4899', icon: '📱' },
    { key: 'supplies' as DirectoryTab, label: 'Supplies', color: '#06b6d4', icon: '📦' },
    { key: 'procedures' as DirectoryTab, label: 'Procedures', color: '#84cc16', icon: '📋' },
    { key: 'training' as DirectoryTab, label: 'Training', color: '#f59e0b', icon: '🎓' },
    { key: 'warehouses' as DirectoryTab, label: 'Warehouses', color: '#6366f1', icon: '🏭' },
    { key: 'orders' as DirectoryTab, label: 'Orders', color: '#14b8a6', icon: '📊' },
    { key: 'reports' as DirectoryTab, label: 'Reports', color: '#059669', icon: '📈' },
    { key: 'feedback' as DirectoryTab, label: 'Feedback', color: '#94a3b8', icon: '💬' }
  ];

  // Helper: render a simple text field for Create User
  function renderField(key: string, label: string, type: 'text' | 'email' = 'text') {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 180 }}>{label}</label>
        <input
          type={type}
          value={(createPayload as any)[key] || ''}
          onChange={(e) => setCreatePayload(prev => ({ ...prev, [key]: e.target.value }))}
          style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}
        />
      </div>
    );
  }

  // Action: create user
  async function handleCreateUser() {
    try {
      setCreating(true); setCreateMsg(null);
      const url = buildAdminApiUrl('/users');
      const body = { role: createRole, ...createPayload } as any;
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setCreateMsg(js?.error || 'Create failed'); return; }
      setCreateMsg('Created successfully');
      // Switch to relevant directory tab
      const map: Record<string, DirectoryTab> = { manager: 'management', contractor: 'contractors', customer: 'customers', center: 'centers', crew: 'crew' };
      setActiveDirectoryTab(map[createRole]);
      // Reset form
      setCreatePayload({});
      setShowCreateForm(false);
    } catch (e) {
      setCreateMsg('Create failed');
    } finally {
      setCreating(false);
    }
  }

  // Get directory schema/structure - AT-A-GLANCE ESSENTIAL FIELDS ONLY
  const getDirectorySchema = () => {
    switch (activeDirectoryTab) {
      case 'contractors':
        return { 
          id: 'CONTRACTOR ID', 
          manager_id: 'CKS MANAGER',
          name: 'COMPANY NAME', 
          status: 'STATUS'
        };
      case 'management':
        return { 
          id: 'MANAGER ID', 
          name: 'MANAGER NAME',
          assigned_center: 'ASSIGNED CENTER',
          status: 'STATUS'
        };
      case 'customers':
        return { 
          id: 'CUSTOMER ID', 
          manager_id: 'CKS MANAGER',
          name: 'COMPANY NAME', 
          status: 'STATUS'
        };
      case 'centers':
        return { 
          id: 'CENTER ID', 
          manager_id: 'CKS MANAGER',
          name: 'CENTER NAME',
          customer_id: 'CUSTOMER ID',
          contractor_id: 'CONTRACTOR ID',
          status: 'STATUS'
        };
      case 'crew':
        return { 
          id: 'CREW ID', 
          manager_id: 'CKS MANAGER',
          center_id: 'ASSIGNED CENTER',
          status: 'STATUS'
        };
      case 'services':
        return { id: 'SERVICE ID', name: 'SERVICE NAME', category: 'CATEGORY', status: 'STATUS' };
      case 'products':
        return { id: 'PRODUCT ID', name: 'PRODUCT NAME', category: 'CATEGORY', unit: 'UNIT', status: 'STATUS' };
      case 'supplies':
        return { id: 'SUPPLY ID', name: 'SUPPLY NAME', category: 'CATEGORY', status: 'STATUS' };
      case 'procedures':
        return { id: 'PROCEDURE ID', name: 'PROCEDURE NAME', center_id: 'CENTER ID', status: 'STATUS' };
      case 'training':
        return { id: 'TRAINING ID', service_id: 'SERVICE ID', name: 'TRAINING NAME', status: 'STATUS' };
      case 'warehouses':
        return { 
          id: 'WAREHOUSE ID', 
          name: 'WAREHOUSE NAME',
          manager_id: 'MANAGER',
          status: 'STATUS'
        };
      case 'orders':
        return { 
          id: 'ORDER ID', 
          type: 'ORDER TYPE', 
          requester: 'REQUESTER', 
          status: 'STATUS', 
          date: 'DATE'
        };
      case 'reports':
        return { 
          id: 'REPORT ID', 
          type: 'REPORT TYPE', 
          reporter: 'REPORTER', 
          status: 'STATUS', 
          date: 'DATE'
        };
      case 'feedback':
        return {
          id: 'FEEDBACK ID',
          kind: 'KIND',
          title: 'TITLE',
          created_by: 'CREATED BY',
          date: 'DATE'
        };
      default:
        return {};
    }
  };

  // Assign tab state (skeleton)
  const [assignRole, setAssignRole] = useState<'manager'|'center'|'crew'>('manager');
  const [assignEntityId, setAssignEntityId] = useState('');
  const [assignWarehouseId, setAssignWarehouseId] = useState('');
  const [assignOptions, setAssignOptions] = useState<{ managers:any[]; centers:any[]; crew:any[]; warehouses:any[] }>({ managers: [], centers: [], crew: [], warehouses: []});
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  // Create tab state
  const [activeCreateTab, setActiveCreateTab] = useState<'users' | 'services' | 'procedures' | 'training' | 'catalog'>('users');

  useEffect(() => {
    let cancelled = false;
    async function loadAssignOptions() {
      try {
        const [mgrR, cenR, crwR, whR] = await Promise.all([
          adminApiFetch(buildAdminApiUrl('/managers', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/centers', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/crew', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/warehouses', { limit: 100 }))
        ]);
        const [mgrJ, cenJ, crwJ, whJ] = await Promise.all([mgrR.json(), cenR.json(), crwR.json(), whR.json()]);
        if (cancelled) return;
        setAssignOptions({
          managers: mgrJ.items || [],
          centers: cenJ.items || [],
          crew: crwJ.items || [],
          warehouses: whJ.items || []
        });
      } catch {
        if (!cancelled) setAssignMsg('Failed to load assign options');
      }
    }
    if (activeSection === 'assign') loadAssignOptions();
    return () => { cancelled = true; };
  }, [activeSection]);

  // Use fetched directory data
  const getCurrentDirectoryData = () => directoryData;

  // Fetch directory data by tab
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true); setError(null);
      try {
        let url = '';
        if (activeDirectoryTab === 'management') url = buildAdminApiUrl('/managers', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'contractors') url = buildAdminApiUrl('/contractors', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'customers') url = buildAdminApiUrl('/customers', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'centers') url = buildAdminApiUrl('/centers', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'crew') url = buildAdminApiUrl('/crew', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'services') url = buildAdminApiUrl('/catalog/items', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'warehouses') url = buildAdminApiUrl('/warehouses', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'products') url = buildAdminApiUrl('/products', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'supplies') url = buildAdminApiUrl('/supplies', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'procedures') url = buildAdminApiUrl('/procedures', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'training') url = buildAdminApiUrl('/training', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'orders') url = buildAdminApiUrl('/orders', { q: searchTerm, limit: 25, offset: 0 });
        if (activeDirectoryTab === 'reports') url = `/api/reports`;
        if (activeDirectoryTab === 'feedback') url = `/api/feedback`;
        if (!url) { setDirectoryData([]); return; }
        const r = await adminApiFetch(url);
        const js = await r.json();
        if (cancelled) return;
        const items = js.items || js.data || [];
        const rows = items.map((it: any) => {
          switch (activeDirectoryTab) {
            case 'management':
              return { manager_id: it.manager_id, manager_name: it.manager_name, assigned_center: it.assigned_center, status: it.status };
            case 'contractors':
              return { contractor_id: it.contractor_id, cks_manager: it.cks_manager, company_name: it.company_name, status: it.status };
            case 'customers':
              return { customer_id: it.customer_id, cks_manager: it.cks_manager, company_name: it.company_name, status: it.status };
            case 'centers':
              return { center_id: it.center_id, manager_id: it.cks_manager, name: it.name || it.center_name, customer_id: it.customer_id, contractor_id: it.contractor_id, status: it.status };
            case 'crew':
              return { crew_id: it.crew_id, manager_id: it.cks_manager, center_id: it.assigned_center, status: it.status };
            case 'services':
              return { id: it.id, name: it.name, category: it.category, status: it.status || (it.active ? 'active' : 'inactive') };
            case 'products':
              return { id: it.product_id, name: it.product_name, category: it.category, unit: it.unit, status: it.status };
            case 'supplies':
              return { id: it.supply_id, name: it.supply_name, category: it.category, status: it.status };
            case 'procedures':
              return { id: it.procedure_id, name: it.procedure_name, center_id: it.center_id, status: it.status };
            case 'training':
              return { id: it.training_id, service_id: it.service_id, name: it.training_name, status: it.status };
            case 'warehouses':
              return { id: it.warehouse_id, name: it.warehouse_name, manager_id: it.manager_id, status: it.status };
            case 'reports':
              return { id: it.report_id, type: it.type, reporter: `${it.created_by_role}:${it.created_by_id}`, status: it.status, date: it.created_at };
            case 'feedback':
              return { id: it.feedback_id, kind: it.kind, title: it.title, created_by: `${it.created_by_role}:${it.created_by_id}`, date: it.created_at };
            default:
              return it;
          }
        });
        setDirectoryData(rows);
      } catch (e) {
        if (!cancelled) setError('Failed to load directory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [activeDirectoryTab, searchTerm]);

  // Smart field detection for user creation - COMPREHENSIVE FORMS
  const getRequiredFieldsForUserType = (userType: DirectoryTab) => {
    const fieldsMap = {
      contractors: ['id', 'name', 'status', 'manager_id', 'contact_person', 'phone', 'email', 'address', 'services_specialized'],
      management: ['id', 'name', 'status', 'assigned_center', 'territory', 'phone', 'email', 'start_date'],
      customers: ['id', 'name', 'status', 'manager_id', 'contact_person', 'phone', 'email', 'address'],
      centers: ['id', 'name', 'status', 'manager_id', 'customer_id', 'contractor_id', 'address', 'phone', 'supervisor_notes'],
      crew: ['id', 'name', 'status', 'manager_id', 'center_id', 'role', 'phone', 'email', 'start_date', 'skills'],
      services: ['id', 'name', 'status', 'category', 'description', 'requirements'],
      products: ['id', 'name', 'status', 'warehouse_id', 'category', 'description', 'price'],
      supplies: ['id', 'name', 'status', 'category', 'supplier', 'cost', 'stock_level'],
      procedures: ['id', 'name', 'status', 'center_id', 'description', 'steps', 'safety_requirements'],
      training: ['id', 'service_id', 'service_name', 'status', 'type', 'duration', 'requirements', 'instructor'],
      warehouses: ['id', 'name', 'status', 'type', 'location', 'capacity', 'manager_contact'],
      orders: ['id', 'type', 'requester', 'status', 'date', 'description', 'priority'],
      reports: ['id', 'type', 'reporter', 'status', 'date', 'summary', 'priority']
    };
    return fieldsMap[userType] || ['id', 'name', 'status'];
  };

  // Render section content based on activeSection
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'directory':
        return (
      <div style={{ padding: '24px 0' }}>
        {/* CKS Directory Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
            🧠 CKS Directory - Complete Business Intelligence
          </h2>
          <p style={{ color: '#888888', fontSize: 14 }}>
            At-a-glance directory showing essential fields. Click any ID to view detailed profile with complete information.
          </p>
        </div>

        {/* Directory Tabs */}
        <div style={{ 
          background: '#111111',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          border: '1px solid #333333'
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {directoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDirectoryTab(tab.key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${activeDirectoryTab === tab.key ? tab.color : '#444444'}`,
                  background: activeDirectoryTab === tab.key ? tab.color : '#222222',
                  color: activeDirectoryTab === tab.key ? '#000000' : tab.color,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <input
              type="text"
              placeholder={`Search ${activeDirectoryTab}... (first 25 rows shown)`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 14
              }}
            />
            <button 
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '10px 16px',
                background: directoryTabs.find(t => t.key === activeDirectoryTab)?.color || '#333333',
                border: 'none',
                borderRadius: 6,
                color: '#000000',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              ➕ Create {activeDirectoryTab.charAt(0).toUpperCase() + activeDirectoryTab.slice(1, -1)}
            </button>
          </div>

          {/* Data Table */}
          <div style={{ 
            background: '#000000',
            border: '1px solid #333333',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', background: '#1a1a1a', borderBottom: '1px solid #333333' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                {activeDirectoryTab.charAt(0).toUpperCase() + activeDirectoryTab.slice(1)} Directory ({getCurrentDirectoryData().length} entries)
              </div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>
                Field Structure: {Object.values(getDirectorySchema()).join(' • ')}
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    {Object.values(getDirectorySchema()).map((fieldName, index) => (
                      <th key={index} style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: '#888888',
                        borderBottom: '1px solid #333333'
                      }}>
                        {fieldName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={Object.keys(getDirectorySchema()).length} style={{ padding: 24, color: '#888' }}>Loading…</td></tr>
                  ) : getCurrentDirectoryData().length > 0 ? (
                    getCurrentDirectoryData()
                      .filter(item => 
                        !searchTerm || 
                        Object.values(item).some(val => 
                          String(val).toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      )
                      .slice(0, 25)
                      .map((item, index) => (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #222222'
                        }}>
                          {Object.keys(getDirectorySchema()).map((key, i) => (
                            <td key={i} style={{ 
                              padding: '12px 16px', 
                              fontSize: 14, 
                              color: '#ffffff',
                              borderBottom: '1px solid #222222'
                            }}>
                              {String((item as any)[key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))
                  ) : (
                    <tr style={{ borderBottom: '1px solid #222222' }}>
                      <td 
                        colSpan={Object.keys(getDirectorySchema()).length} 
                        style={{ 
                          padding: '40px', 
                          textAlign: 'center', 
                          color: '#666666',
                          fontSize: 14,
                          fontStyle: 'italic'
                        }}
                      >
                        No {activeDirectoryTab} entries yet. Use "Create" to add the first {activeDirectoryTab.slice(0, -1)} entry.
                        <br/><span style={{ fontSize: 12, color: '#444444' }}>
                          Fields will populate: {Object.values(getDirectorySchema()).join(' • ')}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create UI is not shown in Directory. Use the Create tab. */}
      </div>
        );

      case 'dashboard':
        return (
          <div style={{ padding: '20px 0' }}>
            {/* Welcome Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000000 0%, #1f1f1f 100%)',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Welcome, {adminName}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                System Administrator ({adminCode})
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>1,523</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Total Users</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>247</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Active Sessions</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#eab308' }}>98.5%</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>System Uptime</div>
              </div>
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>45</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Days Online</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 20,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent System Activity</div>
              <div style={{ space: 12 }}>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>New user created: john.doe@company.com</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>2 hours ago</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>System backup completed successfully</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>4 hours ago</div>
                </div>
                <div style={{ padding: '8px 0', borderBottom: '1px solid #333333' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Security scan completed - No issues found</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>6 hours ago</div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Database optimization completed</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>8 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create':
        return (
          <div style={{ padding: '20px 0' }}>
            {/* Clean header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Create</div>
            </div>

            {/* Create tabs */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #333333' }}>
                {[
                  { key: 'users', label: 'Users', icon: '👤' },
                  { key: 'services', label: 'Services', icon: '🛠️' },
                  { key: 'procedures', label: 'Procedures', icon: '📋' },
                  { key: 'training', label: 'Training', icon: '🎓' },
                  { key: 'catalog', label: 'Catalog', icon: '📦' },
                  { key: 'warehouses', label: 'Warehouses', icon: '🏭' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCreateTab(tab.key as any)}
                    style={{
                      padding: '12px 20px',
                      background: activeCreateTab === tab.key ? '#111111' : 'transparent',
                      border: activeCreateTab === tab.key ? '1px solid #333333' : '1px solid transparent',
                      borderBottom: activeCreateTab === tab.key ? '1px solid #111111' : '1px solid transparent',
                      borderRadius: '8px 8px 0 0',
                      color: activeCreateTab === tab.key ? '#ffffff' : '#888888',
                      fontSize: 14,
                      fontWeight: activeCreateTab === tab.key ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: -1
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: '0 12px 12px 12px',
              padding: 24,
              minHeight: 400
            }}>
              {activeCreateTab === 'users' && (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>Create User</div>
                    <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Provision Manager, Contractor, Customer, Center, or Crew</div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Role</label>
                    <select
                      value={createRole}
                      onChange={(e) => { setCreateRole(e.target.value as any); setCreatePayload({}); setCreateMsg(null); }}
                      style={{ 
                        background: '#000', 
                        color: '#fff', 
                        border: '1px solid #333', 
                        padding: '8px 12px', 
                        borderRadius: 6,
                        fontSize: 14,
                        minWidth: 200
                      }}
                    >
                      <option value="manager">Manager</option>
                      <option value="contractor">Contractor</option>
                      <option value="customer">Customer</option>
                      <option value="center">Center</option>
                      <option value="crew">Crew</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    {createRole === 'manager' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {renderField('manager_name', 'Manager Name')}
                        {renderField('email', 'Email', 'email')}
                        {renderField('phone', 'Phone')}
                        {renderField('assigned_center', 'Assigned Center (CEN-XXX)')}
                      </div>
                    )}
                    {createRole === 'contractor' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {renderField('company_name', 'Company Name')}
                        {renderField('cks_manager', 'CKS Manager (MGR-XXX)')}
                        {renderField('contact_person', 'Contact Person')}
                        {renderField('email', 'Email', 'email')}
                        {renderField('phone', 'Phone')}
                      </div>
                    )}
                    {createRole === 'customer' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {renderField('company_name', 'Company Name')}
                        {renderField('cks_manager', 'CKS Manager (MGR-XXX)')}
                        {renderField('contact_person', 'Contact Person')}
                        {renderField('email', 'Email', 'email')}
                        {renderField('phone', 'Phone')}
                      </div>
                    )}
                    {createRole === 'center' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                        {renderField('center_name', 'Center Name')}
                        {renderField('cks_manager', 'CKS Manager (MGR-XXX)')}
                        {renderField('customer_id', 'Customer ID (CUS-XXX)')}
                        {renderField('contractor_id', 'Contractor ID (CON-XXX)')}
                        {renderField('address', 'Address')}
                      </div>
                    )}
                    {createRole === 'crew' && (
                      <CrewCreateWizard
                        payload={createPayload}
                        setPayload={setCreatePayload}
                        onCreate={handleCreateUser}
                        creating={creating}
                        message={createMsg}
                      />
                    )}
                  </div>

                  {createRole !== 'crew' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button 
                        onClick={handleCreateUser} 
                        disabled={creating} 
                        style={{ 
                          padding: '12px 24px', 
                          background: creating ? '#666' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                          border: 'none', 
                          color: '#ffffff', 
                          borderRadius: 8, 
                          fontWeight: 600, 
                          cursor: creating ? 'not-allowed' : 'pointer',
                          fontSize: 14
                        }}
                      >
                        {creating ? 'Creating…' : 'Create User'}
                      </button>
                      {createMsg && (
                        <div style={{ 
                          fontSize: 13,
                          color: createMsg.includes('✅') ? '#22c55e' : '#f59e0b',
                          padding: '8px 12px',
                          background: '#0a0a0a',
                          borderRadius: 6
                        }}>
                          {createMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeCreateTab === 'services' && (
                <div>
                  <CreateServiceCard />
                </div>
              )}

              {activeCreateTab === 'procedures' && (
                <div>
                  <CreateProcedureCard />
                </div>
              )}

              {activeCreateTab === 'training' && (
                <div>
                  <CreateTrainingCard />
                </div>
              )}

              {activeCreateTab === 'catalog' && (
                <div style={{ textAlign: 'center', padding: 40, color: '#888888' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>Catalog Management</div>
                  <div style={{ fontSize: 14 }}>Product and inventory catalog tools coming soon...</div>
                </div>
              )}

              {activeCreateTab === 'warehouses' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  <CreateWarehouseCard />
                </div>
              )}
            </div>
          </div>
        );

      case 'manage':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Manage Resources</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage existing users, roles, and system resources</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Edit, deactivate, or manage existing user accounts
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>1,523 users</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE USERS
                </button>
              </div>

              {/* Role Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🎭 Role Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Modify permissions and manage existing roles
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>6 active roles</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE ROLES
                </button>
              </div>

              {/* Center Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Center Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage customer centers and their assignments
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>342 active centers</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE CENTERS
                </button>
              </div>

              {/* System Resources */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔧 System Resources</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage system configurations and resources
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>System healthy</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE SYSTEM
                </button>
              </div>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Assign Roles & Permissions</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Assign roles, permissions, and hub access to users</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* Hub Access Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏠 Hub Access</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Assign users to Manager, Contractor, Customer, Center, or Crew hubs
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, background: '#3b82f6', padding: '2px 6px', borderRadius: 4 }}>MANAGER</span>
                  <span style={{ fontSize: 10, background: '#10b981', padding: '2px 6px', borderRadius: 4 }}>CONTRACTOR</span>
                  <span style={{ fontSize: 10, background: '#eab308', padding: '2px 6px', borderRadius: 4 }}>CUSTOMER</span>
                  <span style={{ fontSize: 10, background: '#f97316', padding: '2px 6px', borderRadius: 4 }}>CENTER</span>
                  <span style={{ fontSize: 10, background: '#ef4444', padding: '2px 6px', borderRadius: 4 }}>CREW</span>
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  ASSIGN HUB ACCESS
                </button>
              </div>

              {/* Permission Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔐 Permissions</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Assign specific permissions and access levels to users
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  ASSIGN PERMISSIONS
                </button>
              </div>

              {/* Crew → Center Assignment */}
              <CrewAssignmentCard />

              {/* Bulk Assignment */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>📋 Bulk Assignment</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Bulk assign roles and permissions to multiple users
                </div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  BULK ASSIGNMENT
                </button>
              </div>

              {/* Warehouses Assignment (skeleton) */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏭 Assign Warehouses</div>
                <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>
                  Link Managers, Centers, or Crew to Warehouses (pending Warehouse hub)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>Entity Type</div>
                    <select value={assignRole} onChange={(e) => { setAssignRole(e.target.value as any); setAssignEntityId(''); }} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
                      <option value="manager">Manager</option>
                      <option value="center">Center</option>
                      <option value="crew">Crew</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>Select {assignRole}</div>
                    <select value={assignEntityId} onChange={(e) => setAssignEntityId(e.target.value)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
                      <option value="">-- choose --</option>
                      {(assignRole === 'manager' ? assignOptions.managers : assignRole === 'center' ? assignOptions.centers : assignOptions.crew).map((it: any) => (
                        <option key={it.manager_id || it.center_id || it.crew_id} value={it.manager_id || it.center_id || it.crew_id}>
                          {it.manager_id || it.center_id || it.crew_id} — {it.manager_name || it.name || it.crew_name || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>Select Warehouse</div>
                    <select value={assignWarehouseId} onChange={(e) => setAssignWarehouseId(e.target.value)} style={{ width: '100%', background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
                      <option value="">-- choose --</option>
                      {assignOptions.warehouses.map((w: any) => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_id} — {w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button disabled style={{ width: '100%', padding: '12px 16px', background: '#444', border: 'none', color: '#bbb', borderRadius: 8, fontWeight: 700, cursor: 'not-allowed' }}>
                  Assign (pending backend)
                </button>
                {assignMsg && <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 13 }}>{assignMsg}</div>}
              </div>
            </div>
          </div>
        );

      case 'directory':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>CKS Directory</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Searchable database of all users with IDs and basic information</div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Search users by name, ID, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 500,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid #333333',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Users Table */}
            <div style={{ 
              border: '1px solid #333333',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#111111'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#000000' }}>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      User ID
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Name
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Email
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Role
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Hub
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Last Login
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const hubColor = 
                      user.hub === 'Manager' ? '#3b82f6' :
                      user.hub === 'Contractor' ? '#10b981' :
                      user.hub === 'Customer' ? '#eab308' :
                      user.hub === 'Center' ? '#f97316' :
                      user.hub === 'Crew' ? '#ef4444' : '#666666';
                    
                    return (
                      <tr key={user.id} style={{ borderTop: index > 0 ? '1px solid #333333' : 'none' }}>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {user.id}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.name}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.email}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.role}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            background: hubColor,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            {user.hub}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            color: user.status === 'Active' ? '#10b981' : '#f87171',
                            fontWeight: 600
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          opacity: 0.8
                        }}>
                          {user.lastLogin}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <button style={{
                            padding: '4px 8px',
                            background: '#333333',
                            border: '1px solid #555555',
                            borderRadius: 4,
                            color: '#ffffff',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}>
                            View Account
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: '#888888',
                fontSize: 14
              }}>
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>System Reports</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Analytics and reporting for all hub activities</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Activity Report */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Activity</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Login patterns, session duration, and user engagement across all hubs
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>247 active users today</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Hub Performance */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏠 Hub Performance</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Usage statistics and performance metrics for each hub type
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>All hubs operational</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Security Audit */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔒 Security Audit</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Security events, failed logins, and system vulnerabilities
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>Last scan: 2 hours ago</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* System Health */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>💚 System Health</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Server performance, uptime, and resource utilization
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>98.5% uptime</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Admin Profile</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage your administrator profile and preferences</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
              {/* Profile Info */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}>
                    👤
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{adminName}</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{adminCode}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>System Administrator</div>
                </div>
                
                <div style={{ space: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14 }}>{user.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: 14 }}>{adminInfo.department}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Last Login</div>
                    <div style={{ fontSize: 14 }}>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Profile Settings</div>
                
                <div style={{ space: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Admin Code
                    </label>
                    <input
                      type="text"
                      value={adminCode}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.primaryEmailAddress?.emailAddress || ''}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <button style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    border: '1px solid #555555',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    marginRight: 12
                  }}>
                    UPDATE PROFILE
                  </button>

                  <button style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid #333333',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14
                  }}>
                    CHANGE PASSWORD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#ffffff' }}>
            <h2>Section: {activeSection}</h2>
            <p>Content for {activeSection} section will be implemented here.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      color: '#ffffff' 
    }}>
      {/* Header */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>⚫ AdminHub</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>System Control Center</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{adminName}</div>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#10b981' 
            }}></div>
            <LogoutButton />
          </div>
        </div>
      </div>


      {/* Navigation */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '0 24px',
        overflowX: 'auto'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as AdminSection)}
                style={{
                  padding: '12px 16px',
                  background: activeSection === section.id ? '#ffffff' : 'transparent',
                  color: activeSection === section.id ? '#000000' : '#ffffff',
                  border: 'none',
                  borderBottom: activeSection === section.id ? '2px solid #ffffff' : '2px solid transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {renderSectionContent()}
      </div>
    </div>
  );
}
