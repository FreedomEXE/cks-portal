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
 * - Provide block creation and editing for admin/manager users
 * - Support URL-backed drill-in from day -> block -> task
 *
 * Role in system:
 * - Overrides the generic calendar day view inside the main Schedule tab
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import type { HubRole } from '../../shared/api/hub';
import { saveScheduleBlock, useScheduleDayPlan, type ScheduleBlockDetail } from '../../shared/api/schedule';
import { useCalendarContext } from '../calendar/CalendarProvider';

interface ScheduleTreeNode { user: { id: string; role: string; name: string }; type?: string; children?: ScheduleTreeNode[]; }
interface NamedNode { id: string; role: string; label: string; }
interface EditorTaskDraft {
  localId: string;
  taskId?: string;
  version?: number;
  taskType: string;
  catalogItemCode?: string | null;
  catalogItemType?: string | null;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'skipped';
  areaName: string;
  estimatedMinutes: string;
  requiredTools: string[];
  requiredProducts: string[];
}
interface BlockEditorState { title: string; description: string; blockType: string; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; buildingName: string; areaName: string; startTime: string; endTime: string; centerId: string; crewId: string; tasks: EditorTaskDraft[]; }

interface ProcedureGroup<TTask extends { taskType?: string | null; catalogItemType?: string | null; estimatedMinutes?: string | number | null; status: string }> {
  key: string;
  label: string;
  tasks: TTask[];
  totalMinutes: number;
  completedCount: number;
}

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
function formatProcedureLabel(value?: string | null): string {
  return (value || 'General')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function toEstimatedMinutes(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
function buildProcedureGroups<TTask extends { taskType?: string | null; catalogItemType?: string | null; estimatedMinutes?: string | number | null; status: string }>(tasks: TTask[]): ProcedureGroup<TTask>[] {
  const groups = new Map<string, ProcedureGroup<TTask>>();
  for (const task of tasks) {
    const key = task.catalogItemType || task.taskType || 'general';
    const existing = groups.get(key);
    if (existing) {
      existing.tasks.push(task);
      existing.totalMinutes += toEstimatedMinutes(task.estimatedMinutes);
      if (task.status === 'completed') existing.completedCount += 1;
      continue;
    }
    groups.set(key, {
      key,
      label: formatProcedureLabel(key),
      tasks: [task],
      totalMinutes: toEstimatedMinutes(task.estimatedMinutes),
      completedCount: task.status === 'completed' ? 1 : 0,
    });
  }
  return Array.from(groups.values());
}
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
    tasks: block.tasks.map((task) => ({
      localId: task.taskId,
      taskId: task.taskId,
      version: task.version,
      taskType: task.taskType,
      catalogItemCode: task.catalogItemCode,
      catalogItemType: task.catalogItemType,
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      areaName: task.areaName ?? '',
      estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : '',
      requiredTools: task.requiredTools ?? [],
      requiredProducts: task.requiredProducts ?? [],
    })),
  };
}

function BlockCard({ block, label, onOpen }: { block: ScheduleBlockDetail; label: string; onOpen: (block: ScheduleBlockDetail) => void }) {
  const tone = STATUS_TONES[block.status] ?? STATUS_TONES.scheduled;
  return (
    <button type="button" onClick={() => onOpen(block)} className="w-full rounded-[22px] border border-slate-200/80 bg-white px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{formatTimeLabel(block.startAt, block.endAt)}</div>
          <div className="mt-2 text-sm font-black tracking-[-0.02em] text-slate-950">{block.title}</div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${tone}`}>{block.status.replace(/_/g, ' ')}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">{[label, block.areaName, `${block.tasks.length} tasks`].filter(Boolean).join(' • ')}</div>
    </button>
  );
}

export default function ScheduleDayPlan({ viewerRole, scopeType, scopeId, scopeIds, testMode, scopeTree }: { viewerRole?: HubRole | 'admin'; scopeType?: string; scopeId?: string; scopeIds?: string[]; testMode?: 'include' | 'exclude' | 'only'; scopeTree?: ScheduleTreeNode | null; }) {
  const { anchorDate } = useCalendarContext();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const date = anchorDate.toISOString().slice(0, 10);
  const { data, isLoading, error, mutate } = useScheduleDayPlan({ date, scopeType, scopeId, scopeIds, testMode });
  const nodes = useMemo(() => flattenTree(scopeTree), [scopeTree]);
  const labelById = useMemo(() => new Map(nodes.map((node) => [node.id, node.label])), [nodes]);
  const centerOptions = useMemo(() => nodes.filter((node) => node.role === 'center'), [nodes]);
  const crewOptions = useMemo(() => nodes.filter((node) => node.role === 'crew'), [nodes]);
  const blockParam = normalizeId(searchParams.get('block'));
  const taskParam = normalizeId(searchParams.get('task'));
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
  const [editorBlockId, setEditorBlockId] = useState<string | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);

  const allBlocks = useMemo(
    () => data?.buildings.flatMap((building) => [...building.lanes.flatMap((lane) => lane.blocks), ...building.unassignedBlocks]) ?? [],
    [data],
  );
  const selectedBlock = useMemo(
    () => (blockParam ? allBlocks.find((block) => normalizeId(block.blockId) === blockParam) ?? null : null),
    [allBlocks, blockParam],
  );
  const selectedTask = useMemo(
    () => (selectedBlock && taskParam ? selectedBlock.tasks.find((task) => normalizeId(task.taskId) === taskParam) ?? null : null),
    [selectedBlock, taskParam],
  );
  const canAuthor = viewerRole === 'admin' || viewerRole === 'manager';
  const effectiveCenterId = centerId || (scopeType === 'center' ? scopeId ?? '' : '');
  const defaultCrewId = crewId || (scopeType === 'crew' ? scopeId ?? '' : '');
  const isSourceDerived = Boolean(selectedBlock?.sourceType || selectedBlock?.sourceId);
  const zoomLevel: 'day' | 'block' | 'task' = selectedTask ? 'task' : selectedBlock ? 'block' : 'day';
  const isBlockEditorReadOnly = !canAuthor;

  function updateZoomParams(next: { blockId?: string | null; taskId?: string | null }) {
    const params = new URLSearchParams(searchParams);
    if (next.blockId) {
      params.set('block', next.blockId);
    } else {
      params.delete('block');
      params.delete('task');
    }
    if (next.blockId && next.taskId) {
      params.set('task', next.taskId);
    } else {
      params.delete('task');
    }
    setSearchParams(params, { replace: true });
  }

  async function refreshScheduleSurfaces() {
    await mutate();
    await mutateGlobal((key) => typeof key === 'string' && (key.startsWith('/calendar/') || key.startsWith('/schedule/')));
  }

  useEffect(() => {
    if (!selectedBlock) {
      setEditorState(null);
      setEditorBlockId(null);
      setIsEditorDirty(false);
      return;
    }
    if (editorBlockId !== selectedBlock.blockId || !isEditorDirty) {
      setEditorState(buildEditorState(selectedBlock));
      setEditorBlockId(selectedBlock.blockId);
      setEditorError(null);
      if (editorBlockId !== selectedBlock.blockId) {
        setIsEditorDirty(false);
      }
    }
  }, [selectedBlock, editorBlockId, isEditorDirty]);

  useEffect(() => {
    if (blockParam && !selectedBlock) {
      updateZoomParams({ blockId: null, taskId: null });
      return;
    }
    if (taskParam && selectedBlock && !selectedTask) {
      updateZoomParams({ blockId: selectedBlock.blockId, taskId: null });
    }
  }, [blockParam, taskParam, selectedBlock, selectedTask]);

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
        tasks: [{ title: `${title.trim()} prep`, sequence: 1, status: 'pending', taskType: 'prep' }],
      });
      setComposerOpen(false);
      setTitle('');
      setBuildingName('');
      setAreaName('');
      setCenterId('');
      setCrewId('');
      setIsEditorDirty(false);
      updateZoomParams({ blockId: created.blockId, taskId: null });
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
        tasks: editorState.tasks.filter((task) => task.title.trim()).map((task, index) => {
          const persistedTask = task.taskId ? selectedBlock.tasks.find((item) => item.taskId === task.taskId) : null;
          return {
            taskId: task.taskId,
            version: task.version,
            sequence: index + 1,
            taskType: persistedTask?.taskType ?? task.taskType ?? 'task',
            catalogItemCode: persistedTask?.catalogItemCode ?? task.catalogItemCode ?? null,
            catalogItemType: persistedTask?.catalogItemType ?? task.catalogItemType ?? null,
            title: isSourceDerived && task.taskId ? persistedTask?.title ?? task.title.trim() : task.title.trim(),
            description: isSourceDerived && task.taskId
              ? (persistedTask?.description ?? (task.description.trim() || null))
              : (task.description.trim() || null),
            status: task.status,
            areaName: task.areaName.trim() || null,
            estimatedMinutes: task.estimatedMinutes ? Number(task.estimatedMinutes) : null,
            requiredTools: persistedTask?.requiredTools ?? task.requiredTools ?? [],
            requiredProducts: persistedTask?.requiredProducts ?? task.requiredProducts ?? [],
          };
        }),
      });
      setIsEditorDirty(false);
      await refreshScheduleSurfaces();
    } catch (saveFailure) {
      const status = Number((saveFailure as { status?: number } | null)?.status ?? 0);
      if (status === 409) {
        setIsEditorDirty(false);
        setEditorError('This block changed in another session. The latest version has been reloaded.');
        await refreshScheduleSurfaces();
      } else {
        setEditorError(saveFailure instanceof Error ? saveFailure.message : 'Failed to update schedule block.');
      }
    } finally {
      setIsSavingEditor(false);
    }
  }

  function resetEditor() {
    if (!selectedBlock) return;
    setEditorState(buildEditorState(selectedBlock));
    setEditorBlockId(selectedBlock.blockId);
    setIsEditorDirty(false);
    setEditorError(null);
  }

  function updateEditor<K extends keyof BlockEditorState>(key: K, value: BlockEditorState[K]) {
    setEditorState((current) => current ? { ...current, [key]: value } : current);
    setIsEditorDirty(true);
  }

  function updateTask(localId: string, patch: Partial<EditorTaskDraft>) {
    setEditorState((current) => current ? { ...current, tasks: current.tasks.map((task) => task.localId === localId ? { ...task, ...patch } : task) } : current);
    setIsEditorDirty(true);
  }

  function addTaskDraft() {
    setEditorState((current) => current ? {
      ...current,
      tasks: [
        ...current.tasks,
        {
          localId: buildDraftId('task'),
          taskType: 'task',
          title: 'New task',
          description: '',
          status: 'pending',
          areaName: current.areaName,
          estimatedMinutes: '',
          requiredTools: [],
          requiredProducts: [],
        },
      ],
    } : current);
    setIsEditorDirty(true);
  }
  const selectedEditorTask = useMemo(
    () => (editorState && taskParam ? editorState.tasks.find((task) => normalizeId(task.taskId) === taskParam) ?? null : null),
    [editorState, taskParam],
  );
  const activeTask = selectedEditorTask ?? selectedTask;
  const procedureGroups = useMemo(
    () => buildProcedureGroups(selectedBlock?.tasks ?? []),
    [selectedBlock],
  );
  const editorProcedureGroups = useMemo(
    () => buildProcedureGroups(editorState?.tasks ?? []),
    [editorState],
  );
  const activeProcedureGroup = useMemo(
    () => (activeTask ? editorProcedureGroups.find((group) => group.tasks.some((task) => normalizeId(task.taskId) === normalizeId(activeTask.taskId))) ?? null : null),
    [activeTask, editorProcedureGroups],
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{zoomLevel === 'task' ? 'Task Detail' : zoomLevel === 'block' ? 'Block Detail' : 'Day Plan'}</div>
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
      {zoomLevel !== 'day' && selectedBlock ? (
        <section className="rounded-[24px] border border-slate-200/80 bg-white/95 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button type="button" onClick={() => updateZoomParams({ blockId: null, taskId: null })} className="font-semibold text-slate-600 hover:text-slate-950">Day Plan</button>
              <span className="text-slate-300">/</span>
              <button type="button" onClick={() => updateZoomParams({ blockId: selectedBlock.blockId, taskId: null })} className="font-semibold text-slate-600 hover:text-slate-950">{selectedBlock.title}</button>
              {selectedTask ? <><span className="text-slate-300">/</span><span className="font-semibold text-slate-950">{selectedTask.title}</span></> : null}
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{[selectedBlock.buildingName, selectedBlock.areaName, `${selectedBlock.tasks.length} tasks`].filter(Boolean).join(' • ')}</div>
          </div>
        </section>
      ) : null}
      {canAuthor && zoomLevel === 'day' ? (
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
              <div className="flex items-center gap-3"><button type="button" onClick={handleCreateBlock} disabled={isCreating} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isCreating ? 'Saving...' : 'Create block'}</button>{composerError ? <div className="text-sm text-rose-600">{composerError}</div> : null}</div>
            </div>
          ) : null}
        </section>
      ) : null}
      {isLoading ? <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">Loading day plan...</div> : null}
      {error ? <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-[0_18px_48px_rgba(244,63,94,0.12)]">Failed to load day plan.</div> : null}
      {!isLoading && !error && zoomLevel === 'day' ? (
        <div className="flex flex-col gap-4">
          {(data?.buildings ?? []).map((building) => (
            <section key={building.buildingKey} className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 pb-3"><div className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Building</div><div className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">{building.buildingName}</div>{building.areaName ? <div className="mt-1 text-sm text-slate-500">{building.areaName}</div> : null}</div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {building.lanes.map((lane) => <div key={lane.laneId} className="rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{lane.participantRole ?? 'Lane'}</div><div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">{lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'}</div><div className="mt-3 flex flex-col gap-2">{lane.blocks.map((block) => <BlockCard key={block.blockId} block={block} label={lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'} onOpen={(next) => updateZoomParams({ blockId: next.blockId, taskId: null })} />)}</div></div>)}
                {building.unassignedBlocks.length > 0 ? <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-4"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Unassigned</div><div className="mt-3 flex flex-col gap-2">{building.unassignedBlocks.map((block) => <BlockCard key={block.blockId} block={block} label="Unassigned" onOpen={(next) => updateZoomParams({ blockId: next.blockId, taskId: null })} />)}</div></div> : null}
              </div>
            </section>
          ))}
          {(data?.buildings ?? []).length === 0 ? (
            <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/85 px-6 py-10 text-center shadow-[0_18px_48px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-black text-slate-950">No schedule blocks for this day yet.</div>
              <div className="mt-2 text-sm text-slate-500">Use the day composer to create the first block, or move to another date to inspect existing work.</div>
            </section>
          ) : null}
        </div>
      ) : null}
      {!isLoading && !error && zoomLevel === 'block' && selectedBlock && editorState ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className="rounded-[30px] border border-slate-200/80 bg-slate-900 px-6 py-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">{selectedBlock.blockType.replace(/_/g, ' ')}</div>
                <div className="mt-2 text-3xl font-black tracking-[-0.04em]">{selectedBlock.title}</div>
                <div className="mt-2 text-sm text-white/70">{[formatTimeLabel(selectedBlock.startAt, selectedBlock.endAt), selectedBlock.buildingName, selectedBlock.areaName].filter(Boolean).join(' • ')}</div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75">v{selectedBlock.version}</span>
            </div>
            {selectedBlock.description ? <div className="mt-4 text-sm text-white/75">{selectedBlock.description}</div> : null}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {procedureGroups.map((group) => (
                <div key={group.key} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">{group.label}</div>
                      <div className="mt-1 text-xs text-white/55">{group.tasks.length} tasks • {group.totalMinutes || 0} min • {group.completedCount}/{group.tasks.length} complete</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {group.tasks.map((task) => (
                      <button key={task.taskId} type="button" onClick={() => updateZoomParams({ blockId: selectedBlock.blockId, taskId: task.taskId })} className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black tracking-[-0.02em] text-white">{task.title}</div>
                            <div className="mt-1 text-xs text-white/60">{[task.areaName, task.estimatedMinutes ? `${task.estimatedMinutes} min` : null].filter(Boolean).join(' • ')}</div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${STATUS_TONES[task.status] ?? STATUS_TONES.pending}`}>{task.status.replace(/_/g, ' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]"><div className="flex items-center justify-between gap-3"><div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Block editor</div>{canAuthor ? <button type="button" onClick={resetEditor} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Reset</button> : null}</div>{isSourceDerived ? <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">Source-derived block. Schedule can move timing, assignment, and task status, but source workflow owns title and business details.</div> : null}<div className="mt-4 flex flex-col gap-4"><div className="grid gap-3"><input value={editorState.title} onChange={(event) => updateEditor('title', event.target.value)} disabled={isBlockEditorReadOnly || isSourceDerived} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" /><textarea value={editorState.description} onChange={(event) => updateEditor('description', event.target.value)} disabled={isBlockEditorReadOnly || isSourceDerived} rows={3} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" /><div className="grid gap-3 sm:grid-cols-2"><select value={editorState.blockType} onChange={(event) => updateEditor('blockType', event.target.value)} disabled={isBlockEditorReadOnly || isSourceDerived} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="service_visit">Service visit</option><option value="delivery">Delivery</option><option value="shift">Shift</option><option value="manual">Manual block</option></select><select value={editorState.status} onChange={(event) => updateEditor('status', event.target.value as BlockEditorState['status'])} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><input value={editorState.buildingName} onChange={(event) => updateEditor('buildingName', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" placeholder="Building / site" /><input value={editorState.areaName} onChange={(event) => updateEditor('areaName', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" placeholder="Area" /><input type="time" value={editorState.startTime} onChange={(event) => updateEditor('startTime', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" /><input type="time" value={editorState.endTime} onChange={(event) => updateEditor('endTime', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" /><select value={editorState.centerId} onChange={(event) => updateEditor('centerId', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="">Center (optional)</option>{centerOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><select value={editorState.crewId} onChange={(event) => updateEditor('crewId', event.target.value)} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="">Primary crew (optional)</option>{crewOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></div></div><div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Task stack</div><div className="mt-1 text-sm font-black text-slate-950">Edit task content here, then drill into a task for focused detail.</div></div>{canAuthor && !isSourceDerived ? <button type="button" onClick={addTaskDraft} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Add task</button> : null}</div><div className="mt-4 flex flex-col gap-3">{editorState.tasks.map((task, index) => <button key={task.localId} type="button" onClick={() => task.taskId && updateZoomParams({ blockId: selectedBlock.blockId, taskId: task.taskId })} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-left"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Task {index + 1}</div><div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">{task.title}</div></div><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${STATUS_TONES[task.status] ?? STATUS_TONES.pending}`}>{task.status.replace(/_/g, ' ')}</span></div></button>)}</div></div>{canAuthor ? <div className="flex items-center gap-3"><button type="button" onClick={handleSaveSelectedBlock} disabled={isSavingEditor} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSavingEditor ? 'Saving...' : 'Save changes'}</button>{isEditorDirty ? <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Unsaved changes</div> : null}{editorError ? <div className="text-sm text-rose-600">{editorError}</div> : null}</div> : null}</div></section>
        </div>
      ) : null}
      {!isLoading && !error && zoomLevel === 'task' && selectedBlock && activeTask && editorState ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Task detail</div>
            <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{activeTask.title}</div>
            <div className="mt-2 text-sm text-slate-500">{[selectedBlock.title, activeTask.areaName, activeTask.estimatedMinutes ? `${activeTask.estimatedMinutes} min` : null].filter(Boolean).join(' • ')}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Procedure</div>
                <div className="mt-2 text-lg font-black tracking-[-0.03em] text-slate-950">{activeProcedureGroup?.label ?? 'General'}</div>
                <div className="mt-1 text-sm text-slate-500">{activeProcedureGroup ? `${activeProcedureGroup.tasks.length} steps • ${activeProcedureGroup.totalMinutes || 0} min planned` : 'Single task context'}</div>
                <div className="mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">{activeTask.status.replace(/_/g, ' ')}</div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Execution context</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[selectedBlock.buildingName, selectedBlock.areaName, activeTask.taskType ? formatProcedureLabel(activeTask.taskType) : null].filter(Boolean).map((item) => (
                    <span key={String(item)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{item}</span>
                  ))}
                </div>
                {activeTask.description ? <div className="mt-4 text-sm text-slate-600">{activeTask.description}</div> : <div className="mt-4 text-sm text-slate-500">No task note added yet.</div>}
              </div>
            </div>
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Procedure steps</div>
                  <div className="mt-1 text-sm text-slate-500">Stay in this zoom level while moving through related tasks.</div>
                </div>
                <button type="button" onClick={() => updateZoomParams({ blockId: selectedBlock.blockId, taskId: null })} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Back to block</button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {(activeProcedureGroup?.tasks ?? [activeTask]).map((task) => {
                  const isActive = normalizeId(task.taskId) === normalizeId(activeTask.taskId);
                  return (
                    <button key={task.taskId ?? `${activeProcedureGroup?.key || 'task'}-${task.title}`} type="button" onClick={() => task.taskId && updateZoomParams({ blockId: selectedBlock.blockId, taskId: task.taskId })} className={`rounded-[18px] border px-4 py-3 text-left transition ${isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className={`text-[10px] font-black uppercase tracking-[0.12em] ${isActive ? 'text-white/60' : 'text-slate-500'}`}>Step</div>
                          <div className={`mt-1 text-sm font-black tracking-[-0.02em] ${isActive ? 'text-white' : 'text-slate-950'}`}>{task.title}</div>
                          <div className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-slate-500'}`}>{[task.areaName, task.estimatedMinutes ? `${task.estimatedMinutes} min` : null].filter(Boolean).join(' • ')}</div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${isActive ? 'border-white/15 bg-white/10 text-white' : STATUS_TONES[task.status] ?? STATUS_TONES.pending}`}>{task.status.replace(/_/g, ' ')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {(activeTask.requiredTools.length > 0 || activeTask.requiredProducts.length > 0) ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Required tools</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeTask.requiredTools.length ? activeTask.requiredTools.map((tool) => <span key={tool} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{tool}</span>) : <span className="text-sm text-slate-500">None listed.</span>}
                  </div>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Required products</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeTask.requiredProducts.length ? activeTask.requiredProducts.map((product) => <span key={product} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{product}</span>) : <span className="text-sm text-slate-500">None listed.</span>}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <section className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Task editor</div>
              <button type="button" onClick={() => updateZoomParams({ blockId: selectedBlock.blockId, taskId: null })} className="text-xs font-semibold text-slate-500 hover:text-slate-900">Back to block</button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {editorState.tasks.map((task) => task.taskId === activeTask.taskId ? (
                <div key={task.localId} className="flex flex-col gap-3">
                  <input value={task.title} onChange={(event) => updateTask(task.localId, { title: event.target.value })} disabled={isBlockEditorReadOnly || (isSourceDerived && Boolean(task.taskId))} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                  <textarea value={task.description} onChange={(event) => updateTask(task.localId, { description: event.target.value })} disabled={isBlockEditorReadOnly || (isSourceDerived && Boolean(task.taskId))} rows={4} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" placeholder="Task note / execution guidance" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select value={task.status} onChange={(event) => updateTask(task.localId, { status: event.target.value as EditorTaskDraft['status'] })} disabled={isBlockEditorReadOnly} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="skipped">Skipped</option></select>
                    <input value={task.areaName} onChange={(event) => updateTask(task.localId, { areaName: event.target.value })} disabled={isBlockEditorReadOnly || (isSourceDerived && Boolean(task.taskId))} placeholder="Area" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                    <input value={task.estimatedMinutes} onChange={(event) => updateTask(task.localId, { estimatedMinutes: event.target.value.replace(/[^\d]/g, '') })} disabled={isBlockEditorReadOnly || (isSourceDerived && Boolean(task.taskId))} placeholder="Minutes" className="rounded-2xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Procedure grouping</div>
                      <div className="mt-2 text-sm font-black text-slate-950">{formatProcedureLabel(task.catalogItemType || task.taskType || 'General')}</div>
                      <div className="mt-1 text-sm text-slate-500">{task.catalogItemCode ? `Catalog: ${task.catalogItemCode}` : 'Ad hoc task inside this block.'}</div>
                    </div>
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Resources</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[...task.requiredTools, ...task.requiredProducts].length ? [...task.requiredTools, ...task.requiredProducts].map((resource) => <span key={resource} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{resource}</span>) : <span className="text-sm text-slate-500">No resources listed yet.</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null)}
              {canAuthor ? <div className="flex items-center gap-3"><button type="button" onClick={handleSaveSelectedBlock} disabled={isSavingEditor} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSavingEditor ? 'Saving...' : 'Save block changes'}</button>{isEditorDirty ? <div className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Unsaved changes</div> : null}{editorError ? <div className="text-sm text-rose-600">{editorError}</div> : null}</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
