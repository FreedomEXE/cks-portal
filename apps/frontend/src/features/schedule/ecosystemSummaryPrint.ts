/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ecosystemSummaryPrint.ts
 *
 * Description:
 * Builds a print-friendly ecosystem summary schedule.
 *
 * Responsibilities:
 * - Render compact weekly summary tables for buildings and crews
 * - Keep the summary export dependency-free
 *
 * Role in system:
 * - Used by the Schedule summary export action
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import type { ScheduleEcosystemSummaryResponse } from '../../shared/api/schedule';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${minutes} min`;
  if (!remainder) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

function renderStatusBreakdown(
  breakdown: ScheduleEcosystemSummaryResponse['summary']['statusBreakdown'],
): string {
  return Object.entries(breakdown)
    .map(([status, count]) => `<span class="status-pill">${escapeHtml(status.replace(/_/g, ' '))}: ${count}</span>`)
    .join('');
}

export function buildEcosystemSummaryPrintDocument(
  data: ScheduleEcosystemSummaryResponse,
  input?: { scopeLabel?: string | null },
): string {
  const scopeLabel = input?.scopeLabel ?? null;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Schedule ecosystem summary</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe3ee;
        --wash: #f8fafc;
        --panel: #ffffff;
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
        gap: 20px;
        align-items: flex-start;
        border-bottom: 2px solid var(--ink);
        padding-bottom: 18px;
        margin-bottom: 20px;
      }
      .kicker, .summary-label, th {
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted);
      }
      h1 { margin: 8px 0 6px; font-size: 34px; line-height: 1; }
      .subtitle, td, .status-row {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .summary-card {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px 16px;
        background: var(--wash);
      }
      .summary-value {
        margin-top: 8px;
        font-size: 24px;
        font-weight: 800;
        color: var(--ink);
      }
      .status-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }
      .status-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: var(--panel);
        color: var(--ink);
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .section {
        margin-top: 20px;
        break-inside: avoid;
      }
      .section h2 {
        margin: 0 0 10px;
        font-size: 20px;
        line-height: 1.1;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid var(--line);
        border-radius: 16px;
        overflow: hidden;
        background: var(--panel);
      }
      th, td {
        text-align: left;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      th { background: var(--wash); }
      tr:last-child td { border-bottom: 0; }
      .crew-stack {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .crew-chip {
        font-size: 12px;
        color: var(--ink);
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
      @media (max-width: 960px) {
        body { padding: 18px; }
        .topbar { flex-direction: column; }
        .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        table, thead, tbody, tr, th, td { display: block; }
        thead { display: none; }
        td {
          border-bottom: 1px solid var(--line);
          padding: 8px 12px;
        }
      }
    </style>
  </head>
  <body>
    <main class="sheet">
      <header class="topbar">
        <div>
          <div class="kicker">Schedule ecosystem summary</div>
          <h1>${escapeHtml(scopeLabel ?? 'Current scope')}</h1>
          <div class="subtitle">${escapeHtml([data.weekStart, data.weekEnd].join(' • '))}</div>
        </div>
        <div class="subtitle">Generated ${escapeHtml(new Date(data.generatedAt).toLocaleString('en-CA', { timeZone: 'UTC' }))} UTC</div>
      </header>
      <section class="summary-grid">
        <div class="summary-card"><div class="summary-label">Buildings</div><div class="summary-value">${data.summary.buildingCount}</div></div>
        <div class="summary-card"><div class="summary-label">Crew</div><div class="summary-value">${data.summary.crewCount}</div></div>
        <div class="summary-card"><div class="summary-label">Blocks</div><div class="summary-value">${data.summary.blockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Tasks</div><div class="summary-value">${data.summary.taskCount}</div></div>
        <div class="summary-card"><div class="summary-label">Assigned</div><div class="summary-value">${data.summary.assignedBlockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Unassigned</div><div class="summary-value">${data.summary.unassignedBlockCount}</div></div>
        <div class="summary-card"><div class="summary-label">Planned time</div><div class="summary-value">${escapeHtml(formatMinutes(data.summary.scheduledMinutes))}</div></div>
      </section>
      <div class="status-row">${renderStatusBreakdown(data.summary.statusBreakdown)}</div>

      <section class="section">
        <h2>Buildings</h2>
        <table>
          <thead>
            <tr>
              <th>Building</th>
              <th>Blocks</th>
              <th>Tasks</th>
              <th>Assigned</th>
              <th>Unassigned</th>
              <th>Minutes</th>
              <th>Crews</th>
            </tr>
          </thead>
          <tbody>
            ${data.buildings
              .map(
                (building) => `
              <tr>
                <td>${escapeHtml([building.buildingName, building.areaName].filter(Boolean).join(' • '))}</td>
                <td>${building.blockCount}</td>
                <td>${building.taskCount}</td>
                <td>${building.assignedBlockCount}</td>
                <td>${building.unassignedBlockCount}</td>
                <td>${escapeHtml(formatMinutes(building.scheduledMinutes))}</td>
                <td>
                  <div class="crew-stack">
                    ${building.crews
                      .map(
                        (crew) =>
                          `<div class="crew-chip">${escapeHtml(crew.crewLabel ?? crew.crewId)} • ${crew.blockCount} blocks • ${escapeHtml(formatMinutes(crew.scheduledMinutes))}</div>`,
                      )
                      .join('') || '<div class="crew-chip">No assigned crew</div>'}
                  </div>
                </td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Crew</h2>
        <table>
          <thead>
            <tr>
              <th>Crew</th>
              <th>Blocks</th>
              <th>Tasks</th>
              <th>Minutes</th>
              <th>Buildings</th>
            </tr>
          </thead>
          <tbody>
            ${data.crews
              .map(
                (crew) => `
              <tr>
                <td>${escapeHtml(crew.crewLabel ?? crew.crewId)}</td>
                <td>${crew.blockCount}</td>
                <td>${crew.taskCount}</td>
                <td>${escapeHtml(formatMinutes(crew.scheduledMinutes))}</td>
                <td>${escapeHtml(crew.buildings.join(', '))}</td>
              </tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </section>

      <footer class="footer">Printed from the CKS Schedule workspace.</footer>
    </main>
  </body>
</html>`;
}
