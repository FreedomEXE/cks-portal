/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: buildingWeeklyPrint.ts
 *
 * Description:
 * Builds a print-friendly building weekly schedule.
 *
 * Responsibilities:
 * - Transform weekly building export JSON into printable HTML
 * - Keep weekly schedule export dependency-free
 *
 * Role in system:
 * - Used by the Schedule day-plan building export action
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ScheduleBuildingWeeklyExportResponse } from '../../shared/api/schedule';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTimeRange(startAt: string, endAt: string | null): string {
  const start = new Date(startAt).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  if (!endAt) {
    return start;
  }
  const end = new Date(endAt).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${start} - ${end}`;
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return '0 min';
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) {
    return `${minutes} min`;
  }
  if (!remainder) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainder} min`;
}

function renderBlock(
  block: ScheduleBuildingWeeklyExportResponse['days'][number]['lanes'][number]['blocks'][number],
): string {
  const taskMarkup = block.tasks
    .map((task) => {
      const meta = [task.categoryLabel, task.areaName, task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : null]
        .filter(Boolean)
        .map((part) => escapeHtml(String(part)))
        .join(' • ');
      return `
        <li class="task-item">
          <span class="task-seq">${task.sequence}</span>
          <div class="task-copy">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${meta ? `<div class="task-meta">${meta}</div>` : ''}
          </div>
          <span class="task-status task-status-${escapeHtml(task.status)}">${escapeHtml(task.status.replace(/_/g, ' '))}</span>
        </li>
      `;
    })
    .join('');

  return `
    <article class="block-card">
      <div class="block-row">
        <div>
          <div class="block-time">${escapeHtml(formatTimeRange(block.startAt, block.endAt))}</div>
          <div class="block-title">${escapeHtml(block.title)}</div>
          <div class="block-meta">${[block.blockType.replace(/_/g, ' '), block.centerId].filter(Boolean).map((part) => escapeHtml(String(part))).join(' • ')}</div>
          ${block.description ? `<div class="block-desc">${escapeHtml(block.description)}</div>` : ''}
        </div>
        <div class="block-status block-status-${escapeHtml(block.status)}">${escapeHtml(block.status.replace(/_/g, ' '))}</div>
      </div>
      ${taskMarkup ? `<ol class="task-list">${taskMarkup}</ol>` : ''}
    </article>
  `;
}

function renderDay(
  day: ScheduleBuildingWeeklyExportResponse['days'][number],
  participantLabels: Record<string, string>,
): string {
  const laneMarkup = day.lanes
    .map((lane) => {
      const label = lane.participantId ? participantLabels[lane.participantId] ?? lane.participantId : 'Unassigned';
      return `
        <section class="lane-card">
          <div class="lane-role">${escapeHtml(lane.participantRole ?? 'Lane')}</div>
          <div class="lane-title">${escapeHtml(label)}</div>
          <div class="lane-blocks">${lane.blocks.map(renderBlock).join('') || '<div class="lane-empty">No assigned blocks.</div>'}</div>
        </section>
      `;
    })
    .join('');

  const unassignedMarkup = day.unassignedBlocks.length
    ? `
      <section class="lane-card lane-card-unassigned">
        <div class="lane-role">Unassigned</div>
        <div class="lane-title">Open work</div>
        <div class="lane-blocks">${day.unassignedBlocks.map(renderBlock).join('')}</div>
      </section>
    `
    : '';

  return `
    <section class="day-card">
      <div class="day-head">
        <div>
          <div class="day-label">${escapeHtml(day.weekdayLabel)}</div>
          <div class="day-meta">${day.blockCount} blocks • ${day.taskCount} tasks</div>
        </div>
      </div>
      <div class="lane-grid">${laneMarkup}${unassignedMarkup}</div>
    </section>
  `;
}

export function buildBuildingWeeklyPrintDocument(
  data: ScheduleBuildingWeeklyExportResponse,
  input?: { participantLabels?: Record<string, string> },
): string {
  const participantLabels = input?.participantLabels ?? {};

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(data.buildingName)} · Weekly Schedule</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe3ee;
        --panel: #ffffff;
        --wash: #f8fafc;
        --scheduled: #e0f2fe;
        --scheduled-ink: #0c4a6e;
        --progress: #fef3c7;
        --progress-ink: #92400e;
        --complete: #dcfce7;
        --complete-ink: #166534;
        --cancelled: #ffe4e6;
        --cancelled-ink: #9f1239;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 28px;
        font-family: "Segoe UI", system-ui, sans-serif;
        color: var(--ink);
        background: white;
      }
      .sheet { max-width: 1180px; margin: 0 auto; }
      .topbar {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        border-bottom: 2px solid var(--ink);
        padding-bottom: 18px;
        margin-bottom: 22px;
      }
      .kicker, .summary-label, .lane-role {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted);
      }
      h1 { margin: 8px 0 6px; font-size: 34px; line-height: 1; }
      .subtitle, .day-meta, .task-meta, .block-meta, .block-desc {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 22px;
      }
      .summary-card, .day-card, .lane-card, .block-card {
        border: 1px solid var(--line);
        background: var(--panel);
      }
      .summary-card {
        border-radius: 16px;
        padding: 14px 16px;
        background: var(--wash);
      }
      .summary-value {
        margin-top: 8px;
        font-size: 26px;
        font-weight: 800;
      }
      .day-card {
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 18px;
        break-inside: avoid;
      }
      .day-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
        margin-bottom: 14px;
      }
      .day-label {
        font-size: 22px;
        font-weight: 800;
        line-height: 1.1;
      }
      .lane-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .lane-card {
        border-radius: 16px;
        padding: 14px;
        background: #fff;
      }
      .lane-card-unassigned {
        border-style: dashed;
        background: var(--wash);
      }
      .lane-title {
        margin-top: 5px;
        font-size: 16px;
        font-weight: 800;
      }
      .lane-blocks {
        margin-top: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .block-card {
        border-radius: 14px;
        padding: 12px;
        break-inside: avoid;
      }
      .block-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }
      .block-time {
        font-size: 11px;
        font-weight: 800;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .block-title {
        margin-top: 6px;
        font-size: 15px;
        font-weight: 800;
      }
      .block-desc { margin-top: 5px; }
      .task-list {
        list-style: none;
        margin: 10px 0 0;
        padding: 0;
      }
      .task-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        align-items: start;
        border-top: 1px solid var(--line);
        padding: 10px 0 0;
        margin-top: 10px;
      }
      .task-seq {
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: var(--wash);
        border: 1px solid var(--line);
        font-size: 11px;
        font-weight: 800;
      }
      .task-title {
        font-size: 14px;
        font-weight: 700;
      }
      .task-status, .block-status {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .task-status-scheduled, .block-status-scheduled { background: var(--scheduled); color: var(--scheduled-ink); }
      .task-status-in_progress, .block-status-in_progress { background: var(--progress); color: var(--progress-ink); }
      .task-status-completed, .block-status-completed { background: var(--complete); color: var(--complete-ink); }
      .task-status-cancelled, .block-status-cancelled { background: var(--cancelled); color: var(--cancelled-ink); }
      .task-status-pending, .task-status-skipped { background: var(--wash); color: var(--muted); }
      .lane-empty {
        color: var(--muted);
        font-size: 13px;
        font-style: italic;
      }
      .footer {
        margin-top: 24px;
        padding-top: 12px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      @media print {
        body { padding: 0; }
        .sheet { max-width: none; }
      }
      @media (max-width: 900px) {
        body { padding: 18px; }
        .summary-grid, .lane-grid { grid-template-columns: 1fr; }
        .topbar, .block-row { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="topbar">
        <div>
          <div class="kicker">Building weekly schedule</div>
          <h1>${escapeHtml(data.buildingName)}</h1>
          <div class="subtitle">${escapeHtml([data.areaName, data.weekStart, data.weekEnd].filter(Boolean).join(' • '))}</div>
        </div>
        <div class="subtitle">Generated ${escapeHtml(new Date(data.generatedAt).toLocaleString('en-CA', { timeZone: 'UTC' }))} UTC</div>
      </header>
      <section class="summary-grid">
        <div class="summary-card"><div class="summary-label">Days</div><div class="summary-value">${data.summary.dayCount}</div></div>
        <div class="summary-card"><div class="summary-label">Blocks</div><div class="summary-value">${data.summary.blockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Tasks</div><div class="summary-value">${data.summary.taskCount}</div></div>
        <div class="summary-card"><div class="summary-label">Assigned</div><div class="summary-value">${data.summary.assignedBlockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Unassigned</div><div class="summary-value">${data.summary.unassignedBlockCount}</div></div>
      </section>
      ${data.days.map((day) => renderDay(day, participantLabels)).join('')}
      <footer class="footer">Printed from the CKS Schedule workspace.</footer>
    </main>
  </body>
</html>`;
}
