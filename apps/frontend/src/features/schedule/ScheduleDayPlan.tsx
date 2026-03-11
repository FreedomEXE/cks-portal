/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ScheduleDayPlan.tsx
 *
 * Description:
 * Zoomed day-plan workspace for the Schedule product.
 *
 * Responsibilities:
 * - Render building -> worker lanes for a single selected day
 * - Show task stacks inline for selected schedule blocks
 * - Provide block creation and editing for admin/manager users
 *
 * Role in system:
 * - Overrides the generic calendar day view inside the main Schedule tab
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { useEffect, useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import type { HubRole } from '../../shared/api/hub';
import { saveScheduleBlock, useScheduleDayPlan, type ScheduleBlockDetail } from '../../shared/api/schedule';
import { useCalendarContext } from '../calendar/CalendarProvider';

interface ScheduleTreeNode { user: { id: string; role: string; name: string }; type?: string; children?: ScheduleTreeNode[]; }
interface NamedNode { id: string; role: string; label: string; }
interface EditorTaskDraft { localId: string; taskId?: string; version?: number; title: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped'; areaName: string; estimatedMinutes: string; }
interface BlockEditorState { title: string; description: string; blockType: string; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; buildingName: string; areaName: string; startTime: string; endTime: string; centerId: string; crewId: string; tasks: EditorTaskDraft[]; }

const STATUS_TONES: Record<string, string> = {
  scheduled: 'border-sky-200 bg-sky-50 text-sky-900',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-900',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-900',
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  skipped: 'border-violet-200 bg-violet-50 text-violet-900',
};

function normalizeId(value?: string | null): string | null { if (!value) return null; const trimmed = value.trim(); return trimmed ? trimmed.toUpperCase() : null; }
function formatNodeLabel(node: ScheduleTreeNode): string { const id = normalizeId(node.user.id) ?? 'UNKNOWN'; const name = node.user.name?.trim(); return name && normalizeId(name) !== id ? `${name} (${id})` : id; }
function flattenTree(root: ScheduleTreeNode | null | undefined): NamedNode[] {
  if (!root) return [];
  const nodes: NamedNode[] = [];
  const visit = (node: ScheduleTreeNode) => {
    const id = normalizeId(node.user.id);
    const role = (node.type ?? node.user.role ?? '').trim().toLowerCase();
    if (id && role) nodes.push({ id, role, label: formatNodeLabel(node) });
    (node.children ?? []).forEach(visit);
  };
  visit(root);
  return nodes;
}
function formatTimeLabel(startAt: string, endAt: string | null): string {
  const start = new Date(startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!endAt) return start;
  const end = new Date(endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${start} - ${end}`;
}
function toIso(date: string, time: string): string { return new Date(`${date}T${time}:00Z`).toISOString(); }
function toTimeInput(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${String(parsed.getUTCHours()).padStart(2, '0')}:${String(parsed.getUTCMinutes()).padStart(2, '0')}`;
}
function buildDraftId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function isTestValue(value?: string | null): boolean { return String(value || '').toUpperCase().includes('-TEST'); }
function getPrimaryCrewId(block: ScheduleBlockDetail): string {
  return block.assignments.find((a) => a.participantRole === 'crew' && a.isPrimary)?.participantId
    ?? block.assignments.find((a) => a.participantRole === 'crew' && a.assignmentType === 'assignee')?.participantId
    ?? '';
}
function buildEditorState(block: ScheduleBlockDetail): BlockEditorState {
  return {
    title: block.title,
    description: block.description ?? '',
    blockType: block.blockType,
    status: block.status,
    buildingName: block.buildingName ?? '',
    areaName: block.areaName ?? '',
    startTime: toTimeInput(block.startAt),
    endTime: toTimeInput(block.endAt),
    centerId: block.centerId ?? '',
    crewId: getPrimaryCrewId(block),
    tasks: block.tasks.map((task) => ({ localId: task.taskId, taskId: task.taskId, version: task.version, title: task.title, status: task.status, areaName: task.areaName ?? '', estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : '' })),
  };
}

function BlockCard({ block, label, selected, onSelect }: { block: ScheduleBlockDetail; label: string; selected: boolean; onSelect: (block: ScheduleBlockDetail) => void }) {
  const tone = STATUS_TONES[block.status] ?? STATUS_TONES.scheduled;
  return (
    <button type="button" onClick={() => onSelect(block)} className={`w-full rounded-[22px] border px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${selected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200/80 bg-white hover:border-slate-300'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.14em] ${selected ? 'text-white/60' : 'text-slate-500'}`}>{formatTimeLabel(block.startAt, block.endAt)}</div>
          <div className={`mt-2 text-sm font-black tracking-[-0.02em] ${selected ? 'text-white' : 'text-slate-950'}`}>{block.title}</div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${selected ? 'border-white/20 bg-white/10 text-white' : tone}`}>{block.status.replace(/_/g, ' ')}</span>
      </div>
      <div className={`mt-2 text-xs ${selected ? 'text-white/70' : 'text-slate-500'}`}>{[label, block.areaName, `${block.tasks.length} tasks`].filter(Boolean).join(' • ')}</div>
    </button>
  );
}

export default function ScheduleDayPlan({ viewerRole, scopeType, scopeId, scopeIds, testMode, scopeTree }: { viewerRole?: HubRole | 'admin'; scopeType?: string; scopeId?: string; scopeIds?: string[]; testMode?: 'include' | 'exclude' | 'only'; scopeTree?: ScheduleTreeNode | null; }) {
  const { anchorDate } = useCalendarContext();
  const { mutate: mutateGlobal } = useSWRConfig();
  const date = anchorDate.toISOString().slice(0, 10);
  const { data, isLoading, error, mutate } = useScheduleDayPlan({ date, scopeType, scopeId, scopeIds, testMode });
  const nodes = useMemo(() => flattenTree(scopeTree), [scopeTree]);
  const labelById = useMemo(() => new Map(nodes.map((node) => [node.id, node.label])), [nodes]);
  const centerOptions = useMemo(() => nodes.filter((node) => node.role === 'center'), [nodes]);
  const crewOptions = useMemo(() => nodes.filter((node) => node.role === 'crew'), [nodes]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [areaName, setAreaName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [centerId, setCenterId] = useState('');
  const [crewId, setCrewId] = useState('');
  const [blockType, setBlockType] = useState('service_visit');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<BlockEditorState | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEditor, setIsSavingEditor] = useState(false);

  const selectedBlock = useMemo(() => {
    if (!data || !selectedBlockId) return null;
    for (const building of data.buildings) {
      for (const lane of building.lanes) {
        const found = lane.blocks.find((block) => block.blockId === selectedBlockId);
        if (found) return found;
      }
      const found = building.unassignedBlocks.find((block) => block.blockId === selectedBlockId);
      if (found) return found;
    }
    return null;
  }, [data, selectedBlockId]);

  const canAuthor = viewerRole === 'admin' || viewerRole === 'manager';
  const effectiveCenterId = centerId || (scopeType === 'center' ? scopeId ?? '' : '');
  const defaultCrewId = crewId || (scopeType === 'crew' ? scopeId ?? '' : '');
  const isSourceDerived = Boolean(selectedBlock?.sourceType || selectedBlock?.sourceId);

  useEffect(() => { if (selectedBlock) { setEditorState(buildEditorState(selectedBlock)); setEditorError(null); } else setEditorState(null); }, [selectedBlock?.blockId, selectedBlock?.version, selectedBlock?.updatedAt]);
  useEffect(() => {
    if (selectedBlockId || !data?.buildings?.length) return;
    const first = data.buildings.flatMap((building) => [...building.lanes.flatMap((lane) => lane.blocks), ...building.unassignedBlocks])[0] ?? null;
    if (first) setSelectedBlockId(first.blockId);
  }, [data, selectedBlockId]);

  async function refreshScheduleSurfaces() {
    await mutate();
    await mutateGlobal((key) => typeof key === 'string' && (key.startsWith('/calendar/') || key.startsWith('/schedule/')));
  }

  async function handleCreateBlock() {
    if (!title.trim() || !scopeType || !scopeId) {
      setComposerError('Title and selected scope are required.');
      return;
    }
    setIsCreating(true);
    setComposerError(null);
    try {
      const created = await saveScheduleBlock({
        isTest: [scopeId, effectiveCenterId, defaultCrewId].some((value) => isTestValue(value)),
        scopeType,
        scopeId,
        centerId: effectiveCenterId || undefined,
        buildingName: buildingName.trim() || undefined,
        areaName: areaName.trim() || undefined,
        startAt: toIso(date, startTime),
        endAt: endTime ? toIso(date, endTime) : undefined,
        blockType,
        title: title.trim(),
        status: 'scheduled',
        priority: 'normal',
        assignments: defaultCrewId ? [{ participantId: defaultCrewId, participantRole: 'crew', assignmentType: 'assignee', isPrimary: true, status: 'assigned' }] : undefined,
        tasks: [{ title: `${title.trim()} prep`, sequence: 1, status: 'pending' }],
      });
      setComposerOpen(false);
      setTitle('');
      setBuildingName('');
      setAreaName('');
      setCenterId('');
      setCrewId('');
      setSelectedBlockId(created.blockId);
      await refreshScheduleSurfaces();
    } catch (saveFailure) {
      setComposerError(saveFailure instanceof Error ? saveFailure.message : 'Failed to save schedule block.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveSelectedBlock() {
    if (!selectedBlock || !editorState) return;
    if (!editorState.title.trim()) {
      setEditorError('Block title is required.');
      return;
    }
    setIsSavingEditor(true);
    setEditorError(null);
    try {
      const preservedAssignments = selectedBlock.assignments
        .filter((assignment) => !(assignment.participantRole === 'crew' && assignment.assignmentType === 'assignee'))
        .map((assignment) => ({ participantId: assignment.participantId, participantRole: assignment.participantRole, assignmentType: assignment.assignmentType, isPrimary: assignment.isPrimary, status: assignment.status, metadata: assignment.metadata }));
      const assignments = editorState.crewId
        ? [...preservedAssignments, { participantId: editorState.crewId, participantRole: 'crew', assignmentType: 'assignee', isPrimary: true, status: 'assigned' }]
        : preservedAssignments;
      await saveScheduleBlock({
        blockId: selectedBlock.blockId,
        expectedVersion: selectedBlock.version,
        isTest: [selectedBlock.blockId, selectedBlock.scopeId, editorState.centerId, editorState.crewId].some((value) => isTestValue(value)),
        scopeType: selectedBlock.scopeType,
        scopeId: selectedBlock.scopeId,
        centerId: editorState.centerId || null,
        warehouseId: selectedBlock.warehouseId,
        buildingName: editorState.buildingName.trim() || null,
        areaName: editorState.areaName.trim() || null,
        startAt: toIso(date, editorState.startTime || '09:00'),
        endAt: editorState.endTime ? toIso(date, editorState.endTime) : null,
        timezone: selectedBlock.timezone,
        blockType: isSourceDerived ? selectedBlock.blockType : editorState.blockType,
        title: isSourceDerived ? selectedBlock.title : editorState.title.trim(),
        description: isSourceDerived ? selectedBlock.description : (editorState.description.trim() || null),
        status: editorState.status,
        priority: selectedBlock.priority,
        sourceType: selectedBlock.sourceType,
        sourceId: selectedBlock.sourceId,
        sourceAction: selectedBlock.sourceAction,
        templateId: selectedBlock.templateId,
        recurrenceRule: selectedBlock.recurrenceRule,
        seriesParentId: selectedBlock.seriesParentId,
        occurrenceIndex: selectedBlock.occurrenceIndex,
        generatorKey: selectedBlock.generatorKey,
        metadata: selectedBlock.metadata,
        assignments,
        tasks: editorState.tasks.filter((task) => task.title.trim()).map((task, index) => ({
          taskId: task.taskId,
          version: task.version,
          sequence: index + 1,
          title: isSourceDerived && task.taskId ? selectedBlock.tasks.find((item) => item.taskId === task.taskId)?.title ?? task.title.trim() : task.title.trim(),
          status: task.status,
          areaName: task.areaName.trim() || null,
          estimatedMinutes: task.estimatedMinutes ? Number(task.estimatedMinutes) : null,
          taskType: 'task',
        })),
      });
      await refreshScheduleSurfaces();
    } catch (saveFailure) {
      const status = Number((saveFailure as { status?: number } | null)?.status ?? 0);
      if (status === 409) {
        setEditorError('This block changed in another session. The latest version has been reloaded.');
        await refreshScheduleSurfaces();
      } else {
        setEditorError(saveFailure instanceof Error ? saveFailure.message : 'Failed to update schedule block.');
      }
    } finally {
      setIsSavingEditor(false);
    }
  }

  function updateEditor<K extends keyof BlockEditorState>(key: K, value: BlockEditorState[K]) {
    setEditorState((current) => current ? { ...current, [key]: value } : current);
  }
  function updateTask(localId: string, patch: Partial<EditorTaskDraft>) {
    setEditorState((current) => current ? { ...current, tasks: current.tasks.map((task) => task.localId === localId ? { ...task, ...patch } : task) } : current);
  }
  function addTaskDraft() {
    setEditorState((current) => current ? { ...current, tasks: [...current.tasks, { localId: buildDraftId('task'), title: 'New task', status: 'pending', areaName: current.areaName, estimatedMinutes: '' }] } : current);
  }
  function removeTaskDraft(localId: string) {
    setEditorState((current) => current ? { ...current, tasks: current.tasks.filter((task) => task.localId !== localId) } : current);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Day Plan</div>
            <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{anchorDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Blocks</div><div className="mt-1 text-xl font-black text-slate-950">{data?.summary.blockCount ?? 0}</div></div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Assigned</div><div className="mt-1 text-xl font-black text-slate-950">{data?.summary.assignedBlockCount ?? 0}</div></div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Unassigned</div><div className="mt-1 text-xl font-black text-slate-950">{data?.summary.unassignedBlockCount ?? 0}</div></div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Tasks</div><div className="mt-1 text-xl font-black text-slate-950">{data?.summary.taskCount ?? 0}</div></div>
          </div>
        </div>
      </section>
      {canAuthor ? (
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-sm font-black text-slate-950">Author schedule blocks</div><div className="text-sm text-slate-500">Create editable work blocks directly from the focused day.</div></div>
            <button type="button" onClick={() => setComposerOpen((current) => !current)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)]">{composerOpen ? 'Close composer' : 'Add block'}</button>
          </div>
          {composerOpen ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Block title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={buildingName} onChange={(event) => setBuildingName(event.target.value)} placeholder="Building / site" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={areaName} onChange={(event) => setAreaName(event.target.value)} placeholder="Area" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <select value={blockType} onChange={(event) => setBlockType(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="service_visit">Service visit</option><option value="delivery">Delivery</option><option value="shift">Shift</option><option value="manual">Manual block</option></select>
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <select value={centerId} onChange={(event) => setCenterId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Center (optional)</option>{centerOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
              <select value={crewId} onChange={(event) => setCrewId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">Primary crew (optional)</option>{crewOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleCreateBlock} disabled={isCreating} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isCreating ? 'Saving...' : 'Create block'}</button>
                {composerError ? <div className="text-sm text-rose-600">{composerError}</div> : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">Loading day plan...</div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-[0_18px_48px_rgba(244,63,94,0.12)]">Failed to load day plan.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            {(data?.buildings ?? []).map((building) => (
              <section key={building.buildingKey} className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <div className="border-b border-slate-200 pb-3">
                  <div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Building</div>
                  <div className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">{building.buildingName}</div>
                  {building.areaName ? <div className="mt-1 text-sm text-slate-500">{building.areaName}</div> : null}
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {building.lanes.map((lane) => (
                    <div key={lane.laneId} className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{lane.participantRole ?? 'Lane'}</div>
                      <div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">{lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'}</div>
                      <div className="mt-3 flex flex-col gap-2">{lane.blocks.map((block) => <BlockCard key={block.blockId} block={block} label={lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'} selected={selectedBlockId === block.blockId} onSelect={(next) => setSelectedBlockId(next.blockId)} />)}</div>
                    </div>
                  ))}
                  {building.unassignedBlocks.length > 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Unassigned</div>
                      <div className="mt-3 flex flex-col gap-2">{building.unassignedBlocks.map((block) => <BlockCard key={block.blockId} block={block} label="Unassigned" selected={selectedBlockId === block.blockId} onSelect={(next) => setSelectedBlockId(next.blockId)} />)}</div>
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
            {(data?.buildings ?? []).length === 0 ? <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-8 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.04)]">No schedule blocks exist for this day yet.</div> : null}
          </div>
          <aside className="flex flex-col gap-3">
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-900 px-5 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Selected block</div>
              {selectedBlock ? (
                <>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black tracking-[-0.03em]">{selectedBlock.title}</div>
                      <div className="mt-2 text-sm text-white/70">{formatTimeLabel(selectedBlock.startAt, selectedBlock.endAt)}</div>
                      <div className="mt-1 text-sm text-white/60">{[selectedBlock.blockType, selectedBlock.buildingName, selectedBlock.areaName].filter(Boolean).join(' • ')}</div>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75">v{selectedBlock.version}</span>
                  </div>
                  {selectedBlock.description ? <div className="mt-3 text-sm text-white/70">{selectedBlock.description}</div> : null}
                  {isSourceDerived ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-white/70">Source-derived block. Schedule can move timing, assignment, and task status, but source workflow owns title and business details.</div> : null}
                </>
              ) : <div className="mt-3 text-sm text-white/70">Choose a block to inspect tasks and assignments.</div>}
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Block editor</div>
                {canAuthor && selectedBlock && editorState ? <button type="button" onClick={() => setEditorState(buildEditorState(selectedBlock))} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Reset</button> : null}
              </div>
              {selectedBlock && editorState ? (
                <div className="mt-4 flex flex-col gap-4">
                  <div className="grid gap-3">
                    <input value={editorState.title} onChange={(event) => updateEditor('title', event.target.value)} disabled={isSourceDerived} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                    <textarea value={editorState.description} onChange={(event) => updateEditor('description', event.target.value)} disabled={isSourceDerived} rows={3} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select value={editorState.blockType} onChange={(event) => updateEditor('blockType', event.target.value)} disabled={isSourceDerived} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="service_visit">Service visit</option><option value="delivery">Delivery</option><option value="shift">Shift</option><option value="manual">Manual block</option></select>
                      <select value={editorState.status} onChange={(event) => updateEditor('status', event.target.value as BlockEditorState['status'])} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                      <input value={editorState.buildingName} onChange={(event) => updateEditor('buildingName', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Building / site" />
                      <input value={editorState.areaName} onChange={(event) => updateEditor('areaName', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" placeholder="Area" />
                      <input type="time" value={editorState.startTime} onChange={(event) => updateEditor('startTime', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                      <input type="time" value={editorState.endTime} onChange={(event) => updateEditor('endTime', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
                      <select value={editorState.centerId} onChange={(event) => updateEditor('centerId', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"><option value="">Center (optional)</option>{centerOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
                      <select value={editorState.crewId} onChange={(event) => updateEditor('crewId', event.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"><option value="">Primary crew (optional)</option>{crewOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Task stack</div><div className="mt-1 text-sm font-black text-slate-950">Execution tasks stay inside the day plan.</div></div>
                      {canAuthor && !isSourceDerived ? <button type="button" onClick={addTaskDraft} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Add task</button> : null}
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      {editorState.tasks.length === 0 ? <div className="rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">No tasks added to this block yet.</div> : editorState.tasks.map((task, index) => (
                        <div key={task.localId} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Task {index + 1}</div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${STATUS_TONES[task.status] ?? STATUS_TONES.pending}`}>{task.status.replace(/_/g, ' ')}</span>
                              {canAuthor && !isSourceDerived ? <button type="button" onClick={() => removeTaskDraft(task.localId)} className="text-xs font-semibold text-rose-600 hover:text-rose-700">Remove</button> : null}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3">
                            <input value={task.title} onChange={(event) => updateTask(task.localId, { title: event.target.value })} disabled={isSourceDerived && Boolean(task.taskId)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <select value={task.status} onChange={(event) => updateTask(task.localId, { status: event.target.value as EditorTaskDraft['status'] })} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="skipped">Skipped</option></select>
                              <input value={task.areaName} onChange={(event) => updateTask(task.localId, { areaName: event.target.value })} disabled={isSourceDerived && Boolean(task.taskId)} placeholder="Area" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                              <input value={task.estimatedMinutes} onChange={(event) => updateTask(task.localId, { estimatedMinutes: event.target.value.replace(/[^\d]/g, '') })} disabled={isSourceDerived && Boolean(task.taskId)} placeholder="Minutes" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {canAuthor ? <div className="flex items-center gap-3"><button type="button" onClick={handleSaveSelectedBlock} disabled={isSavingEditor} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSavingEditor ? 'Saving...' : 'Save changes'}</button>{editorError ? <div className="text-sm text-rose-600">{editorError}</div> : null}</div> : null}
                </div>
              ) : <div className="mt-3 text-sm text-slate-500">Choose a block to inspect and edit its schedule details inline.</div>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
