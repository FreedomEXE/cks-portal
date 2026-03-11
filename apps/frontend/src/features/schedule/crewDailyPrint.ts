/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: crewDailyPrint.ts
 *
 * Description:
 * Builds a print-friendly crew daily assignment sheet.
 *
 * Responsibilities:
 * - Transform schedule export JSON into printable HTML
 * - Keep the first export path dependency-free
 *
 * Role in system:
 * - Used by the Schedule day-plan export action
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ScheduleCrewDailyExportResponse } from '../../shared/api/schedule';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateLabel(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
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

function renderTaskList(data: ScheduleCrewDailyExportResponse): string {
  return data.blocks
    .map((block) => {
      const tasks = block.tasks
        .map((task) => {
          const detailParts = [task.categoryLabel, task.areaName, task.estimatedMinutes ? formatMinutes(task.estimatedMinutes) : null]
            .filter(Boolean)
            .map((part) => escapeHtml(String(part)));
          const resourceParts = [
            task.requiredTools.length ? `Tools: ${task.requiredTools.join(', ')}` : null,
            task.requiredProducts.length ? `Products: ${task.requiredProducts.join(', ')}` : null,
          ]
            .filter(Boolean)
            .map((part) => escapeHtml(String(part)));
          return `
            <li class="task-row">
              <div class="task-main">
                <div class="task-title-row">
                  <span class="task-seq">${task.sequence}</span>
                  <span class="task-title">${escapeHtml(task.title)}</span>
                  <span class="task-status task-status-${escapeHtml(task.status)}">${escapeHtml(task.status.replace(/_/g, ' '))}</span>
                </div>
                ${detailParts.length ? `<div class="task-meta">${detailParts.join(' • ')}</div>` : ''}
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                ${resourceParts.length ? `<div class="task-resources">${resourceParts.join(' • ')}</div>` : ''}
              </div>
            </li>
          `;
        })
        .join('');

      const blockMeta = [
        block.buildingName,
        block.areaName,
        block.centerName ?? block.centerId,
        escapeHtml(formatTimeRange(block.startAt, block.endAt)),
      ]
        .filter(Boolean)
        .map((part) => escapeHtml(String(part)))
        .join(' • ');

      return `
        <section class="block-card">
          <div class="block-head">
            <div>
              <div class="block-kicker">${escapeHtml(block.blockType.replace(/_/g, ' '))}</div>
              <h2>${escapeHtml(block.title)}</h2>
              ${blockMeta ? `<div class="block-meta">${blockMeta}</div>` : ''}
              ${block.description ? `<div class="block-desc">${escapeHtml(block.description)}</div>` : ''}
            </div>
            <div class="block-pill block-pill-${escapeHtml(block.status)}">${escapeHtml(block.status.replace(/_/g, ' '))}</div>
          </div>
          <ol class="task-list">${tasks || '<li class="task-row task-row-empty">No tasks assigned for this block.</li>'}</ol>
        </section>
      `;
    })
    .join('');
}

export function buildCrewDailyPrintDocument(data: ScheduleCrewDailyExportResponse): string {
  const subtitleParts = [
    data.centerName ?? data.centerId,
    `${data.summary.blockCount} blocks`,
    `${data.summary.taskCount} tasks`,
    `${data.summary.completedTaskCount} completed`,
    formatMinutes(data.summary.scheduledMinutes),
  ]
    .filter(Boolean)
    .map((part) => escapeHtml(String(part)));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(data.crewName ?? data.crewId)} · Crew Daily Assignment</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe3ee;
        --panel: #ffffff;
        --wash: #f8fafc;
        --accent: #0f172a;
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
        padding: 32px;
        font-family: "Segoe UI", system-ui, sans-serif;
        color: var(--ink);
        background: #fff;
      }
      .sheet {
        max-width: 960px;
        margin: 0 auto;
      }
      .topbar {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        border-bottom: 2px solid var(--ink);
        padding-bottom: 20px;
        margin-bottom: 24px;
      }
      .kicker {
        font-size: 11px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 800;
        color: var(--muted);
      }
      h1 {
        margin: 10px 0 8px;
        font-size: 34px;
        line-height: 1;
      }
      .subtitle {
        font-size: 14px;
        color: var(--muted);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      .summary-card {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px 16px;
        background: var(--wash);
      }
      .summary-label {
        font-size: 11px;
        font-weight: 800;
        color: var(--muted);
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .summary-value {
        margin-top: 8px;
        font-size: 28px;
        font-weight: 800;
      }
      .block-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 18px;
        background: var(--panel);
        margin-bottom: 18px;
        break-inside: avoid;
      }
      .block-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      .block-kicker {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }
      .block-head h2 {
        margin: 8px 0 6px;
        font-size: 21px;
        line-height: 1.15;
      }
      .block-meta, .block-desc, .task-meta, .task-desc, .task-resources {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .block-desc { margin-top: 6px; }
      .task-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .task-row {
        border-top: 1px solid var(--line);
        padding: 12px 0;
      }
      .task-row:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .task-row-empty {
        color: var(--muted);
        font-style: italic;
      }
      .task-title-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
      }
      .task-seq {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--wash);
        border: 1px solid var(--line);
        font-size: 11px;
        font-weight: 800;
      }
      .task-title {
        font-size: 15px;
        font-weight: 700;
      }
      .task-status, .block-pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .task-status-scheduled, .block-pill-scheduled { background: var(--scheduled); color: var(--scheduled-ink); }
      .task-status-in_progress, .block-pill-in_progress { background: var(--progress); color: var(--progress-ink); }
      .task-status-completed, .block-pill-completed { background: var(--complete); color: var(--complete-ink); }
      .task-status-cancelled, .block-pill-cancelled { background: var(--cancelled); color: var(--cancelled-ink); }
      .task-status-pending, .task-status-skipped { background: var(--wash); color: var(--muted); }
      .footer {
        margin-top: 28px;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 12px;
      }
      @media print {
        body { padding: 0; }
        .sheet { max-width: none; }
      }
      @media (max-width: 720px) {
        body { padding: 18px; }
        .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .block-head, .topbar { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="topbar">
        <div>
          <div class="kicker">Crew daily assignment sheet</div>
          <h1>${escapeHtml(data.crewName ?? data.crewId)}</h1>
          <div class="subtitle">${escapeHtml(formatDateLabel(data.date))}</div>
          ${subtitleParts.length ? `<div class="subtitle">${subtitleParts.join(' • ')}</div>` : ''}
        </div>
        <div class="subtitle">Generated ${escapeHtml(new Date(data.generatedAt).toLocaleString('en-CA', { timeZone: 'UTC' }))} UTC</div>
      </header>
      <section class="summary-grid">
        <div class="summary-card"><div class="summary-label">Blocks</div><div class="summary-value">${data.summary.blockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Tasks</div><div class="summary-value">${data.summary.taskCount}</div></div>
        <div class="summary-card"><div class="summary-label">Completed</div><div class="summary-value">${data.summary.completedTaskCount}</div></div>
        <div class="summary-card"><div class="summary-label">Planned time</div><div class="summary-value">${escapeHtml(formatMinutes(data.summary.scheduledMinutes))}</div></div>
      </section>
      ${renderTaskList(data) || '<section class="block-card"><div class="block-desc">No schedule blocks were assigned for this crew on the selected day.</div></section>'}
      <footer class="footer">Printed from the CKS Schedule workspace.</footer>
    </main>
  </body>
</html>`;
}
