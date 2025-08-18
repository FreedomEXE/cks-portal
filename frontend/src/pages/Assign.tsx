import { useEffect, useState } from 'react';
import Page from "../components/Page";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import { buildUrl, apiFetch } from "../lib/apiBase";
import Toast from "../components/ui/Toast";

export default function AssignPage() {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Array<{ id: string; name: string }>>([]);
  const [crew, setCrew] = useState<Array<{ id: string; name: string }>>([]);
  const [centers, setCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [jobId, setJobId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Schedule Training modal state
  const [openTrain, setOpenTrain] = useState(false);
  const [trainCrewId, setTrainCrewId] = useState('');
  const [trainServiceId, setTrainServiceId] = useState('');
  const [trainDate, setTrainDate] = useState('');
  const [trainSubmitting, setTrainSubmitting] = useState(false);
  const [trainError, setTrainError] = useState<string | null>(null);

  // Move Crew Between Centers modal state
  const [openMove, setOpenMove] = useState(false);
  const [moveCrewId, setMoveCrewId] = useState('');
  const [moveToCenterId, setMoveToCenterId] = useState('');
  const [moveSubmitting, setMoveSubmitting] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Assign Service to Center modal state
  const [openSvc, setOpenSvc] = useState(false);
  const [svcCenterId, setSvcCenterId] = useState('');
  const [svcServiceId, setSvcServiceId] = useState('');
  const [svcSubmitting, setSvcSubmitting] = useState(false);
  const [svcError, setSvcError] = useState<string | null>(null);

  useEffect(() => {
    if (!(open || openTrain || openMove || openSvc)) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        // Fetch a small list for selection; fall back to empty on failure
        const [jobsRes, crewRes, centersRes, servicesRes] = await Promise.all([
          apiFetch(buildUrl('/admin/jobs', { limit: 50, offset: 0 })),
          apiFetch(buildUrl('/admin/crew', { limit: 50, offset: 0 })),
          apiFetch(buildUrl('/admin/centers', { limit: 50, offset: 0 })),
          apiFetch(buildUrl('/admin/services', { limit: 50, offset: 0 })),
        ]);
        const jobsJson = jobsRes.ok ? await jobsRes.json() : [];
        const crewJson = crewRes.ok ? await crewRes.json() : [];
        const centersJson = centersRes.ok ? await centersRes.json() : [];
        const servicesJson = servicesRes.ok ? await servicesRes.json() : [];
        const jItems = Array.isArray((jobsJson as any)?.items) ? (jobsJson as any).items : Array.isArray(jobsJson) ? (jobsJson as any) : [];
        const cItems = Array.isArray((crewJson as any)?.items) ? (crewJson as any).items : Array.isArray(crewJson) ? (crewJson as any) : [];
        const ctrItems = Array.isArray((centersJson as any)?.items) ? (centersJson as any).items : Array.isArray(centersJson) ? (centersJson as any) : [];
        const sItems = Array.isArray((servicesJson as any)?.items) ? (servicesJson as any).items : Array.isArray(servicesJson) ? (servicesJson as any) : [];
        const j = jItems.map((r: any) => ({ id: String(r.job_id ?? r.id ?? ''), name: String(r.name ?? r.title ?? `Job ${r.job_id ?? r.id ?? ''}`) })).filter(x => x.id);
        const c = cItems.map((r: any) => ({ id: String(r.crew_id ?? r.id ?? ''), name: String(r.name ?? r.crew_name ?? `Crew ${r.crew_id ?? r.id ?? ''}`) })).filter(x => x.id);
        const ctr = ctrItems.map((r: any) => ({ id: String(r.center_id ?? r.id ?? ''), name: String(r.name ?? r.center_name ?? `Center ${r.center_id ?? r.id ?? ''}`) })).filter(x => x.id);
        const svcs = sItems.map((r: any) => ({ id: String(r.service_id ?? r.id ?? ''), name: String(r.service_name ?? r.name ?? `Service ${r.service_id ?? r.id ?? ''}`) })).filter(x => x.id);
        if (!cancelled) { setJobs(j); setCrew(c); setCenters(ctr); setServices(svcs); }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load options');
      }
    })();
    return () => { cancelled = true; };
  }, [open, openTrain, openMove, openSvc]);

  return (
    <Page title="Assign">
      <p style={{ marginBottom: 12 }}>Quick actions to reassign or schedule work. Choose an action:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div className="ui-card" role="button" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
          <div className="title">Assign Crew to Job</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Open form</div>
        </div>
        <div className="ui-card" role="button" onClick={() => setOpenTrain(true)} style={{ cursor: 'pointer' }}>
          <div className="title">Schedule Training</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Open form</div>
        </div>
        <div className="ui-card" role="button" onClick={() => setOpenMove(true)} style={{ cursor: 'pointer' }}>
          <div className="title">Move Crew Between Centers</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Open form</div>
        </div>
        <div className="ui-card" role="button" onClick={() => setOpenSvc(true)} style={{ cursor: 'pointer' }}>
          <div className="title">Assign Service to Center</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Open form</div>
        </div>
      </div>

      {/* Minimal modal */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.32)' }}>
          <div className="card p-4 w-full max-w-lg bg-white">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
              <div className="text-lg font-semibold">Assign Crew to Job</div>
              <button className="btn" onClick={() => setOpen(false)} aria-label="Close">Close</button>
            </div>
            {error && <div className="alert-error mb-2">{error}</div>}
            <div className="grid gap-3">
              <label className="text-sm">
                <div className="mb-1">Job</div>
                <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
                  <option value="">Select a job…</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Crew</div>
                <Select value={crewId} onChange={(e) => setCrewId(e.target.value)}>
                  <option value="">Select a crew…</option>
                  {crew.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Note (optional)</div>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
              </label>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Button onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                <Button variant="primary" disabled={!jobId || !crewId || submitting} onClick={async () => {
                  setSubmitting(true); setError(null);
                  try {
                    // Submit payload; if endpoint not ready, just simulate success
                    const res = await apiFetch(buildUrl('/admin/jobs/assign-crew'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ jobId, crewId, note })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setOpen(false); setJobId(''); setCrewId(''); setNote('');
                    setToast('Crew assigned to job');
                  } catch (e: any) {
                    setError(e?.message || 'Failed to assign');
                  } finally { setSubmitting(false); }
                }}>Assign</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Training modal */}
      {openTrain && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.32)' }}>
          <div className="card p-4 w-full max-w-lg bg-white">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
              <div className="text-lg font-semibold">Schedule Training</div>
              <button className="btn" onClick={() => setOpenTrain(false)} aria-label="Close">Close</button>
            </div>
            {trainError && <div className="alert-error mb-2">{trainError}</div>}
            <div className="grid gap-3">
              <label className="text-sm">
                <div className="mb-1">Crew</div>
                <Select value={trainCrewId} onChange={(e) => setTrainCrewId(e.target.value)}>
                  <option value="">Select a crew…</option>
                  {crew.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Training/Service</div>
                <Select value={trainServiceId} onChange={(e) => setTrainServiceId(e.target.value)}>
                  <option value="">Select a service…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Date</div>
                <Input type="date" value={trainDate} onChange={(e) => setTrainDate(e.target.value)} />
              </label>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Button onClick={() => setOpenTrain(false)} disabled={trainSubmitting}>Cancel</Button>
                <Button variant="primary" disabled={!trainCrewId || !trainServiceId || !trainDate || trainSubmitting} onClick={async () => {
                  setTrainSubmitting(true); setTrainError(null);
                  try {
                    // Placeholder endpoint; adjust when backend is ready
                    const res = await apiFetch(buildUrl('/admin/training/schedule'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ crewId: trainCrewId, serviceId: trainServiceId, date: trainDate })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setOpenTrain(false); setTrainCrewId(''); setTrainServiceId(''); setTrainDate('');
                    setToast('Training scheduled');
                  } catch (e: any) {
                    setTrainError(e?.message || 'Failed to schedule');
                  } finally { setTrainSubmitting(false); }
                }}>Schedule</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* Move Crew Between Centers modal */}
      {openMove && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.32)' }}>
          <div className="card p-4 w-full max-w-lg bg-white">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
              <div className="text-lg font-semibold">Move Crew Between Centers</div>
              <button className="btn" onClick={() => setOpenMove(false)} aria-label="Close">Close</button>
            </div>
            {moveError && <div className="alert-error mb-2">{moveError}</div>}
            <div className="grid gap-3">
              <label className="text-sm">
                <div className="mb-1">Crew</div>
                <Select value={moveCrewId} onChange={(e) => setMoveCrewId(e.target.value)}>
                  <option value="">Select a crew…</option>
                  {crew.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Destination Center</div>
                <Select value={moveToCenterId} onChange={(e) => setMoveToCenterId(e.target.value)}>
                  <option value="">Select a center…</option>
                  {centers.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                </Select>
              </label>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Button onClick={() => setOpenMove(false)} disabled={moveSubmitting}>Cancel</Button>
                <Button variant="primary" disabled={!moveCrewId || !moveToCenterId || moveSubmitting} onClick={async () => {
                  setMoveSubmitting(true); setMoveError(null);
                  try {
                    const res = await apiFetch(buildUrl('/admin/crew/move-center'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ crewId: moveCrewId, toCenterId: moveToCenterId })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setOpenMove(false); setMoveCrewId(''); setMoveToCenterId('');
                    setToast('Crew moved to new center');
                  } catch (e: any) {
                    setMoveError(e?.message || 'Failed to move crew');
                  } finally { setMoveSubmitting(false); }
                }}>Move</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Service to Center modal */}
      {openSvc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.32)' }}>
          <div className="card p-4 w-full max-w-lg bg-white">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
              <div className="text-lg font-semibold">Assign Service to Center</div>
              <button className="btn" onClick={() => setOpenSvc(false)} aria-label="Close">Close</button>
            </div>
            {svcError && <div className="alert-error mb-2">{svcError}</div>}
            <div className="grid gap-3">
              <label className="text-sm">
                <div className="mb-1">Center</div>
                <Select value={svcCenterId} onChange={(e) => setSvcCenterId(e.target.value)}>
                  <option value="">Select a center…</option>
                  {centers.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                </Select>
              </label>
              <label className="text-sm">
                <div className="mb-1">Service</div>
                <Select value={svcServiceId} onChange={(e) => setSvcServiceId(e.target.value)}>
                  <option value="">Select a service…</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </label>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Button onClick={() => setOpenSvc(false)} disabled={svcSubmitting}>Cancel</Button>
                <Button variant="primary" disabled={!svcCenterId || !svcServiceId || svcSubmitting} onClick={async () => {
                  setSvcSubmitting(true); setSvcError(null);
                  try {
                    const res = await apiFetch(buildUrl('/admin/centers/assign-service'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ centerId: svcCenterId, serviceId: svcServiceId })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    setOpenSvc(false); setSvcCenterId(''); setSvcServiceId('');
                    setToast('Service assigned to center');
                  } catch (e: any) {
                    setSvcError(e?.message || 'Failed to assign service');
                  } finally { setSvcSubmitting(false); }
                }}>Assign</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <div className="ui-card" role="button" aria-disabled="true" style={{ opacity: 0.75, cursor: 'not-allowed' }}>
      <div className="title">{label}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Coming soon</div>
    </div>
  );
}
