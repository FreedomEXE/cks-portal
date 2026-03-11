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
 * - Provide a first Schedule authoring surface for admin/manager users
 *
 * Role in system:
 * - Overrides the generic calendar day view inside the main Schedule tab
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import type { HubRole } from '../../shared/api/hub';
import { saveScheduleBlock, useScheduleDayPlan, type ScheduleBlockDetail } from '../../shared/api/schedule';
import { useCalendarContext } from '../calendar/CalendarProvider';

interface ScheduleTreeNode {
  user: {
    id: string;
    role: string;
    name: string;
  };
  type?: string;
  children?: ScheduleTreeNode[];
}

interface NamedNode {
  id: string;
  role: string;
  label: string;
}

const STATUS_TONES: Record<string, string> = {
  scheduled: 'border-sky-200 bg-sky-50 text-sky-900',
  in_progress: 'border-amber-200 bg-amber-50 text-amber-900',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-900',
};

function normalizeId(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function formatNodeLabel(node: ScheduleTreeNode): string {
  const id = normalizeId(node.user.id) ?? 'UNKNOWN';
  const name = node.user.name?.trim();
  if (name && normalizeId(name) !== id) {
    return `${name} (${id})`;
  }
  return id;
}

function flattenTree(root: ScheduleTreeNode | null | undefined): NamedNode[] {
  if (!root) {
    return [];
  }
  const nodes: NamedNode[] = [];
  const visit = (node: ScheduleTreeNode) => {
    const id = normalizeId(node.user.id);
    const role = (node.type ?? node.user.role ?? '').trim().toLowerCase();
    if (id && role) {
      nodes.push({ id, role, label: formatNodeLabel(node) });
    }
    (node.children ?? []).forEach(visit);
  };
  visit(root);
  return nodes;
}

function formatTimeLabel(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const startText = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (!endAt) {
    return startText;
  }
  const end = new Date(endAt);
  const endText = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${startText} - ${endText}`;
}

function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function BlockCard({
  block,
  label,
  selected,
  onSelect,
}: {
  block: ScheduleBlockDetail;
  label: string;
  selected: boolean;
  onSelect: (block: ScheduleBlockDetail) => void;
}) {
  const tone = STATUS_TONES[block.status] ?? STATUS_TONES.scheduled;
  return (
    <button
      type="button"
      onClick={() => onSelect(block)}
      className={`w-full rounded-[22px] border px-4 py-3 text-left shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 ${
        selected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200/80 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-[10px] font-black uppercase tracking-[0.14em] ${selected ? 'text-white/60' : 'text-slate-500'}`}>
            {formatTimeLabel(block.startAt, block.endAt)}
          </div>
          <div className={`mt-2 text-sm font-black tracking-[-0.02em] ${selected ? 'text-white' : 'text-slate-950'}`}>
            {block.title}
          </div>
        </div>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${selected ? 'border-white/20 bg-white/10 text-white' : tone}`}>
          {block.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div className={`mt-2 text-xs ${selected ? 'text-white/70' : 'text-slate-500'}`}>
        {[label, block.areaName, `${block.tasks.length} tasks`].filter(Boolean).join(' • ')}
      </div>
    </button>
  );
}

export default function ScheduleDayPlan({
  viewerRole,
  scopeType,
  scopeId,
  scopeIds,
  testMode,
  scopeTree,
}: {
  viewerRole?: HubRole | 'admin';
  scopeType?: string;
  scopeId?: string;
  scopeIds?: string[];
  testMode?: 'include' | 'exclude' | 'only';
  scopeTree?: ScheduleTreeNode | null;
}) {
  const { anchorDate } = useCalendarContext();
  const { mutate: mutateGlobal } = useSWRConfig();
  const date = anchorDate.toISOString().slice(0, 10);
  const { data, isLoading, error, mutate } = useScheduleDayPlan({ date, scopeType, scopeId, scopeIds, testMode });
  const directoryNodes = useMemo(() => flattenTree(scopeTree), [scopeTree]);
  const labelById = useMemo(
    () => new Map(directoryNodes.map((node) => [node.id, node.label])),
    [directoryNodes],
  );
  const centerOptions = useMemo(
    () => directoryNodes.filter((node) => node.role === 'center'),
    [directoryNodes],
  );
  const crewOptions = useMemo(
    () => directoryNodes.filter((node) => node.role === 'crew'),
    [directoryNodes],
  );
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedBlock = useMemo(() => {
    if (!data || !selectedBlockId) {
      return null;
    }
    for (const building of data.buildings) {
      for (const lane of building.lanes) {
        const found = lane.blocks.find((block) => block.blockId === selectedBlockId);
        if (found) {
          return found;
        }
      }
      const found = building.unassignedBlocks.find((block) => block.blockId === selectedBlockId);
      if (found) {
        return found;
      }
    }
    return null;
  }, [data, selectedBlockId]);

  const canAuthor = viewerRole === 'admin' || viewerRole === 'manager';
  const effectiveCenterId =
    centerId ||
    (scopeType === 'center' ? scopeId ?? '' : '');
  const defaultCrewId =
    crewId ||
    (scopeType === 'crew' ? scopeId ?? '' : '');

  async function handleCreateBlock() {
    if (!title.trim() || !scopeType || !scopeId) {
      setSaveError('Title and selected scope are required.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveScheduleBlock({
        isTest: [scopeId, effectiveCenterId, defaultCrewId].some((value) => String(value || '').toUpperCase().includes('-TEST')),
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
        assignments: defaultCrewId
          ? [{
              participantId: defaultCrewId,
              participantRole: 'crew',
              assignmentType: 'assignee',
              isPrimary: true,
              status: 'assigned',
            }]
          : undefined,
        tasks: [{
          title: `${title.trim()} prep`,
          sequence: 1,
          status: 'pending',
        }],
      });
      setComposerOpen(false);
      setTitle('');
      setBuildingName('');
      setAreaName('');
      setCenterId('');
      setCrewId('');
      await mutate();
      await mutateGlobal((key) => typeof key === 'string' && key.startsWith('/calendar/'));
    } catch (saveFailure) {
      setSaveError(saveFailure instanceof Error ? saveFailure.message : 'Failed to save schedule block.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-4 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Day Plan</div>
            <div className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
              {anchorDate.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Blocks</div>
              <div className="mt-1 text-xl font-black text-slate-950">{data?.summary.blockCount ?? 0}</div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Assigned</div>
              <div className="mt-1 text-xl font-black text-slate-950">{data?.summary.assignedBlockCount ?? 0}</div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Unassigned</div>
              <div className="mt-1 text-xl font-black text-slate-950">{data?.summary.unassignedBlockCount ?? 0}</div>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Tasks</div>
              <div className="mt-1 text-xl font-black text-slate-950">{data?.summary.taskCount ?? 0}</div>
            </div>
          </div>
        </div>
      </section>

      {canAuthor ? (
        <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-slate-950">Author schedule blocks</div>
              <div className="text-sm text-slate-500">Create editable work blocks directly from the focused day.</div>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen((current) => !current)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(15,23,42,0.18)]"
            >
              {composerOpen ? 'Close composer' : 'Add block'}
            </button>
          </div>
          {composerOpen ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Block title" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={buildingName} onChange={(event) => setBuildingName(event.target.value)} placeholder="Building / site" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input value={areaName} onChange={(event) => setAreaName(event.target.value)} placeholder="Area" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <select value={blockType} onChange={(event) => setBlockType(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="service_visit">Service visit</option>
                <option value="delivery">Delivery</option>
                <option value="shift">Shift</option>
                <option value="manual">Manual block</option>
              </select>
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <select value={centerId} onChange={(event) => setCenterId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Center (optional)</option>
                {centerOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <select value={crewId} onChange={(event) => setCrewId(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">Primary crew (optional)</option>
                {crewOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateBlock}
                  disabled={isSaving}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Create block'}
                </button>
                {saveError ? <div className="text-sm text-rose-600">{saveError}</div> : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
          Loading day plan...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-6 py-6 text-sm text-rose-800 shadow-[0_18px_48px_rgba(244,63,94,0.12)]">
          Failed to load day plan.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                      <div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">
                        {lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'}
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {lane.blocks.map((block) => (
                          <BlockCard
                            key={block.blockId}
                            block={block}
                            label={lane.participantId ? labelById.get(lane.participantId) ?? lane.participantId : 'Unassigned'}
                            selected={selectedBlockId === block.blockId}
                            onSelect={(next) => setSelectedBlockId(next.blockId)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  {building.unassignedBlocks.length > 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Unassigned</div>
                      <div className="mt-3 flex flex-col gap-2">
                        {building.unassignedBlocks.map((block) => (
                          <BlockCard
                            key={block.blockId}
                            block={block}
                            label="Unassigned"
                            selected={selectedBlockId === block.blockId}
                            onSelect={(next) => setSelectedBlockId(next.blockId)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
            {(data?.buildings ?? []).length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-8 text-sm text-slate-500 shadow-[0_18px_48px_rgba(15,23,42,0.04)]">
                No schedule blocks exist for this day yet.
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-3">
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-900 px-5 py-5 text-white shadow-[0_24px_64px_rgba(15,23,42,0.2)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">Selected block</div>
              {selectedBlock ? (
                <>
                  <div className="mt-3 text-lg font-black tracking-[-0.03em]">{selectedBlock.title}</div>
                  <div className="mt-2 text-sm text-white/70">{formatTimeLabel(selectedBlock.startAt, selectedBlock.endAt)}</div>
                  <div className="mt-1 text-sm text-white/60">
                    {[selectedBlock.blockType, selectedBlock.buildingName, selectedBlock.areaName].filter(Boolean).join(' • ')}
                  </div>
                  {selectedBlock.description ? <div className="mt-3 text-sm text-white/70">{selectedBlock.description}</div> : null}
                </>
              ) : (
                <div className="mt-3 text-sm text-white/70">Choose a block to inspect tasks and assignments.</div>
              )}
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Task stack</div>
              {selectedBlock ? (
                <div className="mt-4 flex flex-col gap-3">
                  {selectedBlock.tasks.length === 0 ? (
                    <div className="rounded-[18px] border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                      No tasks added to this block yet.
                    </div>
                  ) : (
                    selectedBlock.tasks.map((task) => (
                      <div key={task.taskId} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Task {task.sequence}</div>
                            <div className="mt-1 text-sm font-black tracking-[-0.02em] text-slate-950">{task.title}</div>
                          </div>
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${STATUS_TONES[task.status] ?? STATUS_TONES.scheduled}`}>
                            {task.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-500">
                          {[task.areaName, task.estimatedMinutes ? `${task.estimatedMinutes} min` : null].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-500">Task details stay inline here as you drill into the day plan.</div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
