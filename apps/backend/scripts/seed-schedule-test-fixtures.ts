/*-----------------------------------------------
  Property of CKS  (c) 2026
-----------------------------------------------*/
/**
 * File: seed-schedule-test-fixtures.ts
 *
 * Description:
 * Seeds TEST-ecosystem authored Schedule blocks and tasks for dense workspace validation.
 *
 * Responsibilities:
 * - Ensure additional TEST planning entities exist for manager/admin review
 * - Materialize a dense weekly day-plan with authored and source-derived blocks
 * - Keep fixture IDs deterministic so the review surface is stable across runs
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import { query } from '../server/db/connection.js';
import { saveScheduleBlock } from '../server/domains/schedule/service.js';
import type { UpsertScheduleBlockInput, UpsertScheduleBlockTaskInput } from '../server/domains/schedule/types.js';

const IDS = {
  manager: 'MGR-001-TEST',
  contractor: 'CON-001-TEST',
  customer: 'CUS-001-TEST',
  centerPrimary: 'CEN-001-TEST',
  centerSecondary: 'CEN-002-TEST',
  crewPrimary: 'CRW-001-TEST',
  crewSupport: 'CRW-002-TEST',
  crewFloat: 'CRW-003-TEST',
  crewSecondary: 'CRW-004-TEST',
  warehouse: 'WHS-001-TEST',
} as const;

type FixtureAssignment = NonNullable<UpsertScheduleBlockInput['assignments']>[number];

type FixtureBlock = Omit<UpsertScheduleBlockInput, 'tasks' | 'assignments'> & {
  blockId: string;
  tasks: UpsertScheduleBlockTaskInput[];
  assignments?: FixtureAssignment[];
};

function startOfUtcDay(date = new Date()): Date {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function atUtcDayOffset(dayOffset: number, hour: number, minute = 0): string {
  const date = startOfUtcDay();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function blockTask(
  blockId: string,
  sequence: number,
  input: Omit<UpsertScheduleBlockTaskInput, 'taskId' | 'sequence'>,
): UpsertScheduleBlockTaskInput {
  return {
    sequence,
    taskId: `${blockId}-TSK-${String(sequence).padStart(3, '0')}`,
    ...input,
  };
}

function crewAssignee(participantId: string, isPrimary = false): FixtureAssignment {
  return {
    participantId,
    participantRole: 'crew',
    assignmentType: 'assignee',
    isPrimary,
    status: 'assigned',
  };
}

function warehouseAssignee(participantId: string): FixtureAssignment {
  return {
    participantId,
    participantRole: 'warehouse',
    assignmentType: 'assignee',
    isPrimary: true,
    status: 'assigned',
  };
}

async function ensureTestEcosystemExists(): Promise<void> {
  const result = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM managers
      WHERE manager_id = $1
    `,
    [IDS.manager],
  );
  if (Number(result.rows[0]?.count || 0) === 0) {
    throw new Error('TEST ecosystem is missing. Run the TEST ecosystem seed before schedule enrichment.');
  }
}

async function ensureSourceFixturesExist(): Promise<void> {
  const result = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM orders
      WHERE order_id = ANY($1::text[])
    `,
    [[
      'CEN-001-TEST-SO-067',
      'CON-001-TEST-SO-068',
      'CON-001-TEST-SO-069',
      'CUS-001-TEST-SO-070',
      'CEN-001-TEST-PO-101',
    ]],
  );
  if (Number(result.rows[0]?.count || 0) < 5) {
    throw new Error('Calendar/source fixtures are missing. Run seed:calendar-test-fixtures before schedule enrichment.');
  }
}

async function ensureAdditionalTestEntities(): Promise<void> {
  await query(
    `
      INSERT INTO centers (
        center_id,
        cks_manager,
        name,
        main_contact,
        address,
        phone,
        email,
        contractor_id,
        customer_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2,
        'Test Annex Center',
        'Annex Center Contact',
        'Annex Test Address',
        '+1 (647) 555-0114',
        'test.annex.center@ckscontracting.ca',
        $3,
        $4,
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (center_id) DO UPDATE SET
        cks_manager = EXCLUDED.cks_manager,
        contractor_id = EXCLUDED.contractor_id,
        customer_id = EXCLUDED.customer_id,
        status = EXCLUDED.status,
        updated_at = NOW()
    `,
    [IDS.centerSecondary, IDS.manager, IDS.contractor, IDS.customer],
  );

  const crewRows = [
    [IDS.crewSupport, 'Test Support Crew', IDS.centerPrimary, 'test.crew.support@ckscontracting.ca', '+1 (647) 555-0111'],
    [IDS.crewFloat, 'Test Float Crew', IDS.centerPrimary, 'test.crew.float@ckscontracting.ca', '+1 (647) 555-0112'],
    [IDS.crewSecondary, 'Test Annex Crew', IDS.centerSecondary, 'test.crew.annex@ckscontracting.ca', '+1 (647) 555-0113'],
  ] as const;

  for (const [crewId, name, assignedCenter, email, phone] of crewRows) {
    await query(
      `
        INSERT INTO crew (
          crew_id,
          name,
          status,
          emergency_contact,
          address,
          phone,
          email,
          assigned_center,
          cks_manager,
          created_at,
          updated_at
        ) VALUES (
          $1,
          $2,
          'active',
          'Test Emergency Contact',
          'Test Address',
          $3,
          $4,
          $5,
          $6,
          NOW(),
          NOW()
        )
        ON CONFLICT (crew_id) DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          assigned_center = EXCLUDED.assigned_center,
          cks_manager = EXCLUDED.cks_manager,
          updated_at = NOW()
      `,
      [crewId, name, phone, email, assignedCenter, IDS.manager],
    );
  }
}

function buildFixtures(): FixtureBlock[] {
  const managerDefaults = {
    isTest: true,
    scopeType: 'manager' as const,
    scopeId: IDS.manager,
    createdBy: IDS.manager,
    updatedBy: IDS.manager,
    timezone: 'America/Toronto',
    priority: 'normal' as const,
  };

  const centerDefaults = {
    isTest: true,
    scopeType: 'center' as const,
    createdBy: IDS.manager,
    updatedBy: IDS.manager,
    timezone: 'America/Toronto',
    priority: 'normal' as const,
  };

  return [
    {
      ...managerDefaults,
      blockId: 'BLK-901-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Lobby',
      startAt: atUtcDayOffset(0, 6, 0),
      endAt: atUtcDayOffset(0, 8, 30),
      blockType: 'shift',
      title: 'North Tower Opening Shift',
      description: 'Opening round with waste, restock, and safety tasks before public arrival.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewPrimary, true), crewAssignee(IDS.crewSupport)],
      tasks: [
        blockTask('BLK-901-TEST', 1, { title: 'Open janitorial storage', taskType: 'opening', catalogItemType: 'opening', areaName: 'Lobby', estimatedMinutes: 15, status: 'completed', description: 'Unlock storage and stage carts for the morning round.', requiredTools: ['Master key'], requiredProducts: [] }),
        blockTask('BLK-901-TEST', 2, { title: 'Empty lobby garbage', taskType: 'waste', catalogItemType: 'waste', areaName: 'Lobby', estimatedMinutes: 20, status: 'pending', description: 'Collect all entrance and desk bins before the first wave arrives.', requiredTools: ['Liner cart'], requiredProducts: ['Black liners'] }),
        blockTask('BLK-901-TEST', 3, { title: 'Restock restroom paper', taskType: 'restock', catalogItemType: 'restock', areaName: 'Ground Floor Restrooms', estimatedMinutes: 25, status: 'pending', description: 'Replenish paper, soap, and sanitizer for both washrooms.', requiredTools: ['Restock tote'], requiredProducts: ['Paper towel', 'Foam soap'] }),
        blockTask('BLK-901-TEST', 4, { title: 'Morning safety sweep', taskType: 'safety', catalogItemType: 'safety', areaName: 'Entrance + Elevator Bank', estimatedMinutes: 20, status: 'pending', description: 'Check mats, wet-floor signage, and slip points.', requiredTools: ['Wet floor signs'], requiredProducts: [] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-902-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'East Wing',
      startAt: atUtcDayOffset(0, 9, 0),
      endAt: atUtcDayOffset(0, 11, 0),
      blockType: 'service_visit',
      title: 'Midday Deep Clean',
      description: 'Source-derived service block for constrained edit testing.',
      status: 'in_progress',
      sourceType: 'service',
      sourceId: 'CEN-001-TEST-SRV-002',
      sourceAction: 'sync',
      assignments: [crewAssignee(IDS.crewPrimary, true)],
      tasks: [
        blockTask('BLK-902-TEST', 1, { title: 'Deep clean restrooms', taskType: 'cleaning', catalogItemType: 'deep-clean', areaName: 'East Wing Restrooms', estimatedMinutes: 40, status: 'in_progress', description: 'Scrub high-touch fixtures and partitions.', requiredTools: ['Detail brushes'], requiredProducts: ['Disinfectant'] }),
        blockTask('BLK-902-TEST', 2, { title: 'Polish fixtures', taskType: 'polish', catalogItemType: 'detail', areaName: 'East Wing Restrooms', estimatedMinutes: 25, status: 'pending', description: 'Finish chrome and mirror touchpoints after sanitizing.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Glass cleaner'] }),
        blockTask('BLK-902-TEST', 3, { title: 'Re-stage consumables', taskType: 'restock', catalogItemType: 'restock', areaName: 'Supply Cabinet', estimatedMinutes: 15, status: 'pending', description: 'Top up restock shelves for the afternoon crew.', requiredTools: ['Restock tote'], requiredProducts: ['Soap cartridges'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-903-TEST',
      centerId: IDS.centerPrimary,
      warehouseId: IDS.warehouse,
      buildingName: 'North Tower',
      areaName: 'Janitorial Closet',
      startAt: atUtcDayOffset(0, 11, 30),
      endAt: atUtcDayOffset(0, 12, 15),
      blockType: 'delivery',
      title: 'Supply Drop + Restock',
      description: 'Warehouse-supported drop to test logistics visibility in Schedule.',
      status: 'scheduled',
      sourceType: 'order',
      sourceId: 'CEN-001-TEST-PO-101',
      sourceAction: 'sync',
      assignments: [warehouseAssignee(IDS.warehouse), crewAssignee(IDS.crewSupport)],
      tasks: [
        blockTask('BLK-903-TEST', 1, { title: 'Receive PPE shipment', taskType: 'delivery', catalogItemType: 'delivery', areaName: 'Janitorial Closet', estimatedMinutes: 15, status: 'pending', description: 'Check incoming counts against the order handoff.', requiredTools: ['Receiving scanner'], requiredProducts: ['PPE cartons'] }),
        blockTask('BLK-903-TEST', 2, { title: 'Distribute gloves and masks', taskType: 'distribution', catalogItemType: 'restock', areaName: 'Closet + Team Lockers', estimatedMinutes: 20, status: 'pending', description: 'Split the shipment into the main crew staging bins.', requiredTools: ['Distribution cart'], requiredProducts: ['Gloves', 'Masks'] }),
      ],
    },
    {
      ...centerDefaults,
      blockId: 'BLK-904-TEST',
      scopeId: IDS.centerPrimary,
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Reception',
      startAt: atUtcDayOffset(0, 13, 0),
      endAt: atUtcDayOffset(0, 14, 0),
      blockType: 'manual',
      title: 'Midday Touchpoint Reset',
      description: 'Unassigned block so managers can review staffing gaps and quick authoring edits.',
      status: 'scheduled',
      assignments: [],
      tasks: [
        blockTask('BLK-904-TEST', 1, { title: 'Sanitize reception desk', taskType: 'touchpoint', catalogItemType: 'sanitization', areaName: 'Reception', estimatedMinutes: 20, status: 'pending', description: 'Wipe desk, phone, guest pens, and queue markers.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Surface disinfectant'] }),
        blockTask('BLK-904-TEST', 2, { title: 'Refresh waiting area', taskType: 'reset', catalogItemType: 'reset', areaName: 'Waiting Area', estimatedMinutes: 15, status: 'pending', description: 'Straighten seating, spot-clean tables, and reset magazines.', requiredTools: ['Caddy'], requiredProducts: ['Glass cleaner'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-905-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'South Annex',
      areaName: 'Court A',
      startAt: atUtcDayOffset(0, 13, 30),
      endAt: atUtcDayOffset(0, 15, 0),
      blockType: 'service_visit',
      title: 'Court Sanitization Sweep',
      description: 'Dedicated athletic area sweep to create same-day multi-building density.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewFloat, true)],
      tasks: [
        blockTask('BLK-905-TEST', 1, { title: 'Disinfect benches', taskType: 'sanitization', catalogItemType: 'sanitization', areaName: 'Court A', estimatedMinutes: 20, status: 'pending', description: 'Complete all benches and scorer surfaces.', requiredTools: ['Sprayer'], requiredProducts: ['Hospital disinfectant'] }),
        blockTask('BLK-905-TEST', 2, { title: 'Sweep bleachers', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Bleachers', estimatedMinutes: 25, status: 'pending', description: 'Collect debris before the evening practice block.', requiredTools: ['Wide broom'], requiredProducts: [] }),
        blockTask('BLK-905-TEST', 3, { title: 'Reset sideline waste', taskType: 'waste', catalogItemType: 'waste', areaName: 'Sidelines', estimatedMinutes: 15, status: 'pending', description: 'Swap liners and move full bags to the staging cart.', requiredTools: ['Waste cart'], requiredProducts: ['Large liners'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-906-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Common Areas',
      startAt: atUtcDayOffset(0, 18, 0),
      endAt: null,
      blockType: 'shift',
      title: 'Evening Closeout',
      description: 'Open-ended closeout block for no-end-time rendering.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewPrimary, true)],
      tasks: [
        blockTask('BLK-906-TEST', 1, { title: 'Close perimeter bins', taskType: 'waste', catalogItemType: 'waste', areaName: 'Common Areas', estimatedMinutes: 20, status: 'pending', description: 'Run the final waste pull for entrances and lounges.', requiredTools: ['Liner cart'], requiredProducts: ['Black liners'] }),
        blockTask('BLK-906-TEST', 2, { title: 'Secure equipment room', taskType: 'closing', catalogItemType: 'closing', areaName: 'Equipment Room', estimatedMinutes: 10, status: 'pending', description: 'Lock down machinery and confirm charger status.', requiredTools: ['Master key'], requiredProducts: [] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-907-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Level 2',
      startAt: atUtcDayOffset(-1, 13, 30),
      endAt: atUtcDayOffset(-1, 15, 0),
      blockType: 'service_visit',
      title: 'Completed Floor Treatment',
      description: 'Historic completed block for day-plan and export review.',
      status: 'completed',
      sourceType: 'service',
      sourceId: 'CEN-001-TEST-SRV-003',
      sourceAction: 'sync',
      assignments: [crewAssignee(IDS.crewPrimary, true)],
      tasks: [
        blockTask('BLK-907-TEST', 1, { title: 'Vacuum treatment zone', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Level 2 Hallway', estimatedMinutes: 20, status: 'completed', description: 'Pre-clean the hall before applying treatment.', requiredTools: ['Backpack vacuum'], requiredProducts: [] }),
        blockTask('BLK-907-TEST', 2, { title: 'Apply floor treatment', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Level 2 Hallway', estimatedMinutes: 35, status: 'completed', description: 'Apply and buff according to floor-care standard.', requiredTools: ['Auto scrubber'], requiredProducts: ['Floor finish'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-908-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'West Restrooms',
      startAt: atUtcDayOffset(1, 14, 30),
      endAt: atUtcDayOffset(1, 15, 30),
      blockType: 'service_visit',
      title: 'Cancelled Restroom Reset',
      description: 'Cancelled block to verify status handling and print visibility.',
      status: 'cancelled',
      sourceType: 'service',
      sourceId: 'CEN-001-TEST-SRV-004',
      sourceAction: 'sync',
      assignments: [],
      tasks: [
        blockTask('BLK-908-TEST', 1, { title: 'Replace empty dispensers', taskType: 'restock', catalogItemType: 'restock', areaName: 'West Restrooms', estimatedMinutes: 20, status: 'cancelled', description: 'Was scheduled before the block was cancelled.', requiredTools: ['Restock tote'], requiredProducts: ['Soap cartridges'] }),
        blockTask('BLK-908-TEST', 2, { title: 'Spot-clean partitions', taskType: 'touchpoint', catalogItemType: 'sanitization', areaName: 'West Restrooms', estimatedMinutes: 15, status: 'cancelled', description: 'Cancelled with the parent block.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Disinfectant'] }),
      ],
    },
    {
      ...centerDefaults,
      blockId: 'BLK-909-TEST',
      scopeId: IDS.centerSecondary,
      centerId: IDS.centerSecondary,
      buildingName: 'East Annex',
      areaName: 'Lobby',
      startAt: atUtcDayOffset(1, 7, 0),
      endAt: atUtcDayOffset(1, 9, 0),
      blockType: 'shift',
      title: 'East Annex Lobby Rotation',
      description: 'Second-center authored block so manager/admin can test deeper scope drill.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewSecondary, true)],
      tasks: [
        blockTask('BLK-909-TEST', 1, { title: 'Lobby mat reset', taskType: 'opening', catalogItemType: 'opening', areaName: 'Lobby', estimatedMinutes: 15, status: 'pending', description: 'Reposition all entry mats and confirm dry conditions.', requiredTools: ['Wet floor signs'], requiredProducts: [] }),
        blockTask('BLK-909-TEST', 2, { title: 'Front desk touchpoint pass', taskType: 'touchpoint', catalogItemType: 'sanitization', areaName: 'Front Desk', estimatedMinutes: 20, status: 'pending', description: 'Sanitize all customer-facing touchpoints.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Surface disinfectant'] }),
      ],
    },
    {
      ...centerDefaults,
      blockId: 'BLK-910-TEST',
      scopeId: IDS.centerSecondary,
      centerId: IDS.centerSecondary,
      buildingName: 'East Annex',
      areaName: 'Training Rooms',
      startAt: atUtcDayOffset(2, 10, 0),
      endAt: atUtcDayOffset(2, 12, 30),
      blockType: 'manual',
      title: 'Training Room Turnover',
      description: 'Secondary-center turnover block with denser task stack.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewSecondary, true)],
      tasks: [
        blockTask('BLK-910-TEST', 1, { title: 'Reset tables and chairs', taskType: 'reset', catalogItemType: 'reset', areaName: 'Training Rooms', estimatedMinutes: 25, status: 'pending', description: 'Restore standard classroom layout after event use.', requiredTools: ['Furniture dolly'], requiredProducts: [] }),
        blockTask('BLK-910-TEST', 2, { title: 'Sanitize AV surfaces', taskType: 'sanitization', catalogItemType: 'sanitization', areaName: 'AV Stations', estimatedMinutes: 20, status: 'pending', description: 'Disinfect touchscreens, remotes, and podium surfaces.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Electronics-safe cleaner'] }),
        blockTask('BLK-910-TEST', 3, { title: 'Restock coffee station', taskType: 'restock', catalogItemType: 'restock', areaName: 'Breakout Counter', estimatedMinutes: 15, status: 'pending', description: 'Top up cups, stir sticks, and creamers.', requiredTools: ['Restock tote'], requiredProducts: ['Coffee supplies'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-911-TEST',
      centerId: IDS.centerPrimary,
      warehouseId: IDS.warehouse,
      buildingName: 'Supply Hub',
      areaName: 'Dock 2',
      startAt: atUtcDayOffset(2, 8, 30),
      endAt: atUtcDayOffset(2, 9, 15),
      blockType: 'delivery',
      title: 'Warehouse Dispatch Window',
      description: 'Warehouse-owned planning block to test logistics-only visibility and exports.',
      status: 'scheduled',
      assignments: [warehouseAssignee(IDS.warehouse)],
      tasks: [
        blockTask('BLK-911-TEST', 1, { title: 'Stage dispatch totes', taskType: 'delivery', catalogItemType: 'delivery', areaName: 'Dock 2', estimatedMinutes: 20, status: 'pending', description: 'Prepare morning totes for outbound drop windows.', requiredTools: ['Dispatch scanner'], requiredProducts: ['Supply totes'] }),
        blockTask('BLK-911-TEST', 2, { title: 'Confirm transfer manifests', taskType: 'logistics', catalogItemType: 'logistics', areaName: 'Dispatch Desk', estimatedMinutes: 15, status: 'pending', description: 'Cross-check all manifests before departure.', requiredTools: ['Manifest binder'], requiredProducts: [] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-912-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'South Annex',
      areaName: 'Gym + Hallway',
      startAt: atUtcDayOffset(3, 9, 0),
      endAt: atUtcDayOffset(3, 11, 30),
      blockType: 'service_visit',
      title: 'Multi-Crew Deep Clean',
      description: 'Shared-responsibility block for crew-utilization review.',
      status: 'scheduled',
      priority: 'high',
      assignments: [crewAssignee(IDS.crewPrimary, true), crewAssignee(IDS.crewFloat)],
      tasks: [
        blockTask('BLK-912-TEST', 1, { title: 'Auto-scrub main hallway', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Hallway', estimatedMinutes: 40, status: 'pending', description: 'Run the hallway before gym traffic begins.', requiredTools: ['Auto scrubber'], requiredProducts: ['Neutral cleaner'] }),
        blockTask('BLK-912-TEST', 2, { title: 'Bleacher wipe-down', taskType: 'sanitization', catalogItemType: 'sanitization', areaName: 'Gym', estimatedMinutes: 30, status: 'pending', description: 'Complete a full disinfecting pass across bleachers.', requiredTools: ['Extension wands'], requiredProducts: ['Disinfectant'] }),
        blockTask('BLK-912-TEST', 3, { title: 'Refill sports bottle station', taskType: 'restock', catalogItemType: 'restock', areaName: 'Gym Entrance', estimatedMinutes: 15, status: 'pending', description: 'Replenish wipes, liners, and sanitizer.', requiredTools: ['Restock tote'], requiredProducts: ['Sanitizer', 'Wipes'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-913-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Food Court',
      startAt: atUtcDayOffset(0, 15, 30),
      endAt: atUtcDayOffset(0, 16, 45),
      blockType: 'manual',
      title: 'Urgent Spill Response',
      description: 'High-priority block to review urgent styling and in-progress status.',
      status: 'in_progress',
      priority: 'urgent',
      assignments: [crewAssignee(IDS.crewSupport, true)],
      tasks: [
        blockTask('BLK-913-TEST', 1, { title: 'Isolate spill zone', taskType: 'safety', catalogItemType: 'safety', areaName: 'Food Court', estimatedMinutes: 10, status: 'completed', description: 'Set perimeter and signage immediately.', requiredTools: ['Barrier cones'], requiredProducts: [] }),
        blockTask('BLK-913-TEST', 2, { title: 'Remove liquid and debris', taskType: 'spill-response', catalogItemType: 'spill-response', areaName: 'Food Court', estimatedMinutes: 25, status: 'in_progress', description: 'Neutralize and clear all residue from the tile field.', requiredTools: ['Wet vac'], requiredProducts: ['Absorbent powder'] }),
        blockTask('BLK-913-TEST', 3, { title: 'Reset customer path', taskType: 'reset', catalogItemType: 'reset', areaName: 'Food Court', estimatedMinutes: 10, status: 'pending', description: 'Return furniture to standard circulation pattern.', requiredTools: ['Furniture glides'], requiredProducts: [] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-914-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Mechanical Corridor',
      startAt: atUtcDayOffset(4, 10, 0),
      endAt: atUtcDayOffset(4, 11, 0),
      blockType: 'manual',
      title: 'Quality Audit Walk',
      description: 'Audit-style authored block with skipped/cancelled task states.',
      status: 'completed',
      assignments: [crewAssignee(IDS.crewFloat, true)],
      tasks: [
        blockTask('BLK-914-TEST', 1, { title: 'Inspect drain line access', taskType: 'inspection', catalogItemType: 'inspection', areaName: 'Mechanical Corridor', estimatedMinutes: 15, status: 'completed', description: 'Check for obstruction and signage compliance.', requiredTools: ['Inspection flashlight'], requiredProducts: [] }),
        blockTask('BLK-914-TEST', 2, { title: 'Document paint scuffs', taskType: 'inspection', catalogItemType: 'inspection', areaName: 'Mechanical Corridor', estimatedMinutes: 10, status: 'skipped', description: 'Skipped because the corridor was closed to access.', requiredTools: ['Tablet'], requiredProducts: [] }),
        blockTask('BLK-914-TEST', 3, { title: 'Replace missing caution sign', taskType: 'safety', catalogItemType: 'safety', areaName: 'Mechanical Corridor', estimatedMinutes: 10, status: 'cancelled', description: 'Cancelled after sign stock was found elsewhere on-site.', requiredTools: ['Tool pouch'], requiredProducts: ['Caution sign'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-915-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'South Annex',
      areaName: 'Meeting Rooms',
      startAt: atUtcDayOffset(-2, 14, 0),
      endAt: atUtcDayOffset(-2, 16, 0),
      blockType: 'manual',
      title: 'Backfill Archive Day',
      description: 'Earlier-in-week block so weekly exports show non-current-day density.',
      status: 'completed',
      assignments: [crewAssignee(IDS.crewSupport, true)],
      tasks: [
        blockTask('BLK-915-TEST', 1, { title: 'Vacuum meeting rooms', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Meeting Rooms', estimatedMinutes: 30, status: 'completed', description: 'Full pass on all carpeted rooms.', requiredTools: ['Backpack vacuum'], requiredProducts: [] }),
        blockTask('BLK-915-TEST', 2, { title: 'Sanitize touch surfaces', taskType: 'touchpoint', catalogItemType: 'sanitization', areaName: 'Meeting Rooms', estimatedMinutes: 25, status: 'completed', description: 'Tables, remotes, and shared controls.', requiredTools: ['Microfiber cloths'], requiredProducts: ['Surface disinfectant'] }),
      ],
    },
    {
      ...managerDefaults,
      blockId: 'BLK-916-TEST',
      centerId: IDS.centerPrimary,
      buildingName: 'North Tower',
      areaName: 'Level 3 Offices',
      startAt: atUtcDayOffset(5, 17, 0),
      endAt: atUtcDayOffset(5, 19, 0),
      blockType: 'shift',
      title: 'Weekend Flex Coverage',
      description: 'Future-weekend block to test far-end weekly print density.',
      status: 'scheduled',
      assignments: [crewAssignee(IDS.crewPrimary, true)],
      tasks: [
        blockTask('BLK-916-TEST', 1, { title: 'Collect perimeter waste', taskType: 'waste', catalogItemType: 'waste', areaName: 'Level 3 Offices', estimatedMinutes: 30, status: 'pending', description: 'Weekend close pull for the office wing.', requiredTools: ['Liner cart'], requiredProducts: ['Black liners'] }),
        blockTask('BLK-916-TEST', 2, { title: 'Spot mop entries', taskType: 'floor-care', catalogItemType: 'floor-care', areaName: 'Level 3 Entries', estimatedMinutes: 20, status: 'pending', description: 'Clean high-traffic entries before Monday turnover.', requiredTools: ['Flat mop'], requiredProducts: ['Neutral cleaner'] }),
      ],
    },
  ];
}

async function seedFixtures(fixtures: FixtureBlock[]): Promise<void> {
  for (const fixture of fixtures) {
    await saveScheduleBlock(fixture);
  }
}

async function summarize(fixtures: FixtureBlock[]): Promise<void> {
  const blockIds = fixtures.map((fixture) => fixture.blockId);
  const summary = await query<{ status: string; count: string }>(
    `
      SELECT status, COUNT(*)::text AS count
      FROM schedule_blocks
      WHERE block_id = ANY($1::text[])
      GROUP BY status
      ORDER BY status
    `,
    [blockIds],
  );

  const taskSummary = await query<{ status: string; count: string }>(
    `
      SELECT status, COUNT(*)::text AS count
      FROM schedule_block_tasks
      WHERE block_id = ANY($1::text[])
      GROUP BY status
      ORDER BY status
    `,
    [blockIds],
  );

  const calendarCount = await query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM calendar_events
      WHERE generator_key = ANY($1::text[])
    `,
    [blockIds.map((blockId) => `block:${blockId}`)],
  );

  console.log(`Seeded ${fixtures.length} TEST schedule blocks for review.`);
  console.log(`- Projected calendar events: ${calendarCount.rows[0]?.count ?? '0'}`);
  for (const row of summary.rows) {
    console.log(`- blocks / ${row.status}: ${row.count}`);
  }
  for (const row of taskSummary.rows) {
    console.log(`- tasks / ${row.status}: ${row.count}`);
  }
}

async function main(): Promise<void> {
  await ensureTestEcosystemExists();
  await ensureSourceFixturesExist();
  await ensureAdditionalTestEntities();
  const fixtures = buildFixtures();
  await seedFixtures(fixtures);
  await summarize(fixtures);
}

main().catch((error) => {
  console.error('[seed-schedule-test-fixtures] failed', error);
  process.exitCode = 1;
});
