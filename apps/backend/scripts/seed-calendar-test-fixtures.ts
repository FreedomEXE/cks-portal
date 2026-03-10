/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: seed-calendar-test-fixtures.ts
 *
 * Description:
 * Seeds TEST-ecosystem source rows for dense calendar verification.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { query, withTransaction } from '../server/db/connection.js';
import { syncOrderCalendarProjection } from '../server/domains/calendar/projections.js';

type ParticipantType = 'creator' | 'destination' | 'actor' | 'watcher';

type FixtureParticipant = {
  participantId: string;
  participantRole: string;
  participationType: ParticipantType;
};

type FixtureItem = {
  name: string;
  itemType: 'service' | 'product';
  catalogItemCode: string;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
};

type FixtureService = {
  serviceId: string;
  serviceName: string;
  category: string;
  description: string;
  pricingModel: string;
  requirements: string;
  status: string;
  managedBy: string;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
};

type FixtureOrder = {
  orderId: string;
  orderType: 'service' | 'product';
  title: string;
  status: string;
  nextActorRole: string | null;
  nextActorId: string | null;
  creatorId: string;
  creatorRole: string;
  customerId: string | null;
  centerId: string | null;
  contractorId: string | null;
  managerId: string | null;
  crewId: string | null;
  assignedWarehouse: string | null;
  destination: string | null;
  destinationRole: string | null;
  requestedDate: string;
  expectedDate: string | null;
  serviceStartDate: string | null;
  deliveryDate: string | null;
  totalAmount: number;
  transformedId: string | null;
  rejectionReason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  participants: FixtureParticipant[];
  items: FixtureItem[];
  service?: FixtureService;
};

const IDS = {
  manager: 'MGR-001-TEST',
  contractor: 'CON-001-TEST',
  customer: 'CUS-001-TEST',
  center: 'CEN-001-TEST',
  crew: 'CRW-001-TEST',
  warehouse: 'WHS-001-TEST',
  catalogService: 'SRV-TEST-001',
  catalogProduct: 'PRD-TEST-001',
};

function atUtcDayOffset(dayOffset: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}

function buildParticipants(order: {
  creatorId: string;
  creatorRole: string;
  destination: string | null;
  destinationRole: string | null;
  managerId: string | null;
  contractorId: string | null;
  customerId: string | null;
  centerId: string | null;
  crewId: string | null;
  assignedWarehouse: string | null;
  extra?: FixtureParticipant[];
}): FixtureParticipant[] {
  const priorities: Record<ParticipantType, number> = {
    watcher: 1,
    actor: 2,
    destination: 3,
    creator: 4,
  };
  const map = new Map<string, FixtureParticipant>();
  const push = (participantId: string | null | undefined, participantRole: string | null | undefined, participationType: ParticipantType) => {
    const id = (participantId || '').trim().toUpperCase();
    const role = (participantRole || '').trim().toLowerCase();
    if (!id || !role) return;
    const key = `${id}:${role}`;
    const existing = map.get(key);
    if (!existing || priorities[participationType] > priorities[existing.participationType]) {
      map.set(key, { participantId: id, participantRole: role, participationType });
    }
  };

  push(order.creatorId, order.creatorRole, 'creator');
  push(order.destination, order.destinationRole, 'destination');
  push(order.managerId, 'manager', 'actor');
  push(order.contractorId, 'contractor', 'actor');
  push(order.customerId, 'customer', 'actor');
  push(order.centerId, 'center', 'actor');
  push(order.crewId, 'crew', 'actor');
  push(order.assignedWarehouse, 'warehouse', 'actor');
  for (const participant of order.extra ?? []) {
    push(participant.participantId, participant.participantRole, participant.participationType);
  }
  return Array.from(map.values());
}

function lineTotal(item: FixtureItem): number {
  return Number((item.quantity * item.unitPrice).toFixed(2));
}

function buildFixtures(): FixtureOrder[] {
  const serviceLine = (name: string, price: number): FixtureItem => ({
    name,
    itemType: 'service',
    catalogItemCode: IDS.catalogService,
    description: `${name} test fixture service`,
    quantity: 1,
    unitOfMeasure: 'service',
    unitPrice: price,
  });

  const productLine = (name: string, quantity: number, price: number): FixtureItem => ({
    name,
    itemType: 'product',
    catalogItemCode: IDS.catalogProduct,
    description: `${name} test fixture product`,
    quantity,
    unitOfMeasure: 'unit',
    unitPrice: price,
  });

  const serviceFixtures: FixtureOrder[] = [
    {
      orderId: 'CEN-001-TEST-SO-067',
      orderType: 'service',
      title: 'Morning Opening Service',
      status: 'service_created',
      nextActorRole: 'crew',
      nextActorId: IDS.crew,
      creatorId: IDS.center,
      creatorRole: 'center',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: IDS.crew,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-2, 15, 0),
      expectedDate: atUtcDayOffset(1, 14, 0),
      serviceStartDate: atUtcDayOffset(1, 14, 0),
      deliveryDate: null,
      totalAmount: 240,
      transformedId: 'CEN-001-TEST-SRV-001',
      rejectionReason: null,
      notes: 'Opening service fixture for crew-visible upcoming work.',
      metadata: {
        serviceStartDate: atUtcDayOffset(1, 14, 0),
        serviceEndDate: atUtcDayOffset(1, 16, 0),
        serviceType: 'opening',
        serviceStatus: 'scheduled',
        crew: [IDS.crew],
        tasks: ['Unlock janitorial storage', 'Stage supplies', 'Inspect lobby'],
        procedures: ['Procedure A', 'Procedure B'],
        training: ['PPE refresh'],
      },
      participants: buildParticipants({
        creatorId: IDS.center,
        creatorRole: 'center',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: IDS.crew,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Morning Opening Service', 240)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-001',
        serviceName: 'Morning Opening Service',
        category: 'test',
        description: 'Upcoming crew-visible service visit.',
        pricingModel: 'flat',
        requirements: 'None',
        status: 'active',
        managedBy: IDS.manager,
      },
    },
    {
      orderId: 'CON-001-TEST-SO-068',
      orderType: 'service',
      title: 'Midday Deep Clean',
      status: 'service_created',
      nextActorRole: 'crew',
      nextActorId: IDS.crew,
      creatorId: IDS.contractor,
      creatorRole: 'contractor',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: IDS.crew,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-3, 16, 0),
      expectedDate: atUtcDayOffset(0, 17, 0),
      serviceStartDate: atUtcDayOffset(0, 17, 0),
      deliveryDate: null,
      totalAmount: 395,
      transformedId: 'CEN-001-TEST-SRV-002',
      rejectionReason: null,
      notes: 'Active in-progress fixture with no planned end to test compact pills.',
      metadata: {
        serviceStartDate: atUtcDayOffset(0, 17, 0),
        serviceStatus: 'in_progress',
        crew: [IDS.crew],
        tasks: ['Deep clean restrooms', 'Polish fixtures'],
        crewRequests: [{ crewId: IDS.crew, status: 'accepted' }],
      },
      participants: buildParticipants({
        creatorId: IDS.contractor,
        creatorRole: 'contractor',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: IDS.crew,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Midday Deep Clean', 395)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-002',
        serviceName: 'Midday Deep Clean',
        category: 'test',
        description: 'In-progress service visit fixture.',
        pricingModel: 'flat',
        requirements: 'None',
        status: 'in_progress',
        managedBy: IDS.manager,
        actualStartTime: atUtcDayOffset(0, 17, 20),
      },
    },
    {
      orderId: 'CON-001-TEST-SO-069',
      orderType: 'service',
      title: 'Completed Floor Treatment',
      status: 'service_created',
      nextActorRole: null,
      nextActorId: null,
      creatorId: IDS.contractor,
      creatorRole: 'contractor',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: IDS.crew,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-6, 14, 0),
      expectedDate: atUtcDayOffset(-1, 13, 30),
      serviceStartDate: atUtcDayOffset(-1, 13, 30),
      deliveryDate: null,
      totalAmount: 310,
      transformedId: 'CEN-001-TEST-SRV-003',
      rejectionReason: null,
      notes: 'Completed fixture for historic agenda coverage.',
      metadata: {
        serviceStartDate: atUtcDayOffset(-1, 13, 30),
        serviceEndDate: atUtcDayOffset(-1, 15, 0),
        serviceStatus: 'completed',
        serviceCompletedAt: atUtcDayOffset(-1, 15, 6),
        crew: [IDS.crew],
      },
      participants: buildParticipants({
        creatorId: IDS.contractor,
        creatorRole: 'contractor',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: IDS.crew,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Completed Floor Treatment', 310)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-003',
        serviceName: 'Completed Floor Treatment',
        category: 'test',
        description: 'Completed service visit fixture.',
        pricingModel: 'flat',
        requirements: 'None',
        status: 'completed',
        managedBy: IDS.manager,
        actualStartTime: atUtcDayOffset(-1, 13, 36),
        actualEndTime: atUtcDayOffset(-1, 15, 6),
      },
    },
    {
      orderId: 'CUS-001-TEST-SO-070',
      orderType: 'service',
      title: 'Cancelled Restroom Reset',
      status: 'cancelled',
      nextActorRole: null,
      nextActorId: null,
      creatorId: IDS.customer,
      creatorRole: 'customer',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-1, 19, 0),
      expectedDate: atUtcDayOffset(2, 14, 30),
      serviceStartDate: atUtcDayOffset(2, 14, 30),
      deliveryDate: null,
      totalAmount: 175,
      transformedId: 'CEN-001-TEST-SRV-004',
      rejectionReason: 'Site closed for maintenance.',
      notes: 'Cancelled fixture to validate status tone and row handling.',
      metadata: {
        serviceStartDate: atUtcDayOffset(2, 14, 30),
        serviceEndDate: atUtcDayOffset(2, 15, 30),
        serviceStatus: 'cancelled',
      },
      participants: buildParticipants({
        creatorId: IDS.customer,
        creatorRole: 'customer',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Cancelled Restroom Reset', 175)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-004',
        serviceName: 'Cancelled Restroom Reset',
        category: 'test',
        description: 'Cancelled service visit fixture.',
        pricingModel: 'flat',
        requirements: 'None',
        status: 'cancelled',
        managedBy: IDS.manager,
      },
    },
    {
      orderId: 'WHS-001-TEST-SO-071',
      orderType: 'service',
      title: 'Warehouse-Supplied Equipment Service',
      status: 'service_created',
      nextActorRole: 'warehouse',
      nextActorId: IDS.warehouse,
      creatorId: IDS.warehouse,
      creatorRole: 'warehouse',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-1, 20, 0),
      expectedDate: atUtcDayOffset(3, 19, 0),
      serviceStartDate: atUtcDayOffset(3, 19, 0),
      deliveryDate: null,
      totalAmount: 520,
      transformedId: 'CEN-001-TEST-SRV-005',
      rejectionReason: null,
      notes: 'Warehouse-visible service fixture for cross-role testing.',
      metadata: {
        serviceStartDate: atUtcDayOffset(3, 19, 0),
        serviceEndDate: atUtcDayOffset(3, 21, 30),
        serviceType: 'warehouse-supported',
        serviceStatus: 'scheduled',
      },
      participants: buildParticipants({
        creatorId: IDS.warehouse,
        creatorRole: 'warehouse',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [serviceLine('Warehouse-Supplied Equipment Service', 520)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-005',
        serviceName: 'Warehouse-Supplied Equipment Service',
        category: 'warehouse',
        description: 'Warehouse-supported service visit fixture.',
        pricingModel: 'flat',
        requirements: 'Equipment staging',
        status: 'active',
        managedBy: IDS.warehouse,
      },
    },
    {
      orderId: 'CEN-001-TEST-SO-072',
      orderType: 'service',
      title: 'Overlap Sanitization Pass',
      status: 'service_created',
      nextActorRole: 'manager',
      nextActorId: IDS.manager,
      creatorId: IDS.center,
      creatorRole: 'center',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-1, 11, 0),
      expectedDate: atUtcDayOffset(1, 15, 0),
      serviceStartDate: atUtcDayOffset(1, 15, 0),
      deliveryDate: null,
      totalAmount: 205,
      transformedId: 'CEN-001-TEST-SRV-006',
      rejectionReason: null,
      notes: 'Overlapping event without crew assignment.',
      metadata: {
        serviceStartDate: atUtcDayOffset(1, 15, 0),
        serviceEndDate: atUtcDayOffset(1, 17, 0),
        serviceStatus: 'scheduled',
        tasks: ['Sanitize touchpoints', 'Refill dispensers'],
      },
      participants: buildParticipants({
        creatorId: IDS.center,
        creatorRole: 'center',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Overlap Sanitization Pass', 205)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-006',
        serviceName: 'Overlap Sanitization Pass',
        category: 'test',
        description: 'Overlapping scheduled service fixture.',
        pricingModel: 'flat',
        requirements: 'None',
        status: 'active',
        managedBy: IDS.manager,
      },
    },
    {
      orderId: 'MGR-001-TEST-SO-073',
      orderType: 'service',
      title: 'Unassigned Monthly Inspection',
      status: 'service_created',
      nextActorRole: 'contractor',
      nextActorId: IDS.contractor,
      creatorId: IDS.manager,
      creatorRole: 'manager',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-5, 13, 0),
      expectedDate: atUtcDayOffset(7, 16, 0),
      serviceStartDate: atUtcDayOffset(7, 16, 0),
      deliveryDate: null,
      totalAmount: 285,
      transformedId: 'CEN-001-TEST-SRV-007',
      rejectionReason: null,
      notes: 'Manager-created upcoming inspection fixture.',
      metadata: {
        serviceStartDate: atUtcDayOffset(7, 16, 0),
        serviceEndDate: atUtcDayOffset(7, 17, 30),
        serviceStatus: 'scheduled',
        procedures: ['Monthly compliance walkthrough'],
        training: ['Inspection handling'],
      },
      participants: buildParticipants({
        creatorId: IDS.manager,
        creatorRole: 'manager',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Unassigned Monthly Inspection', 285)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-007',
        serviceName: 'Unassigned Monthly Inspection',
        category: 'inspection',
        description: 'Future scheduled inspection fixture.',
        pricingModel: 'flat',
        requirements: 'Manager review',
        status: 'active',
        managedBy: IDS.manager,
      },
    },
    {
      orderId: 'CUS-001-TEST-SO-074',
      orderType: 'service',
      title: 'Far Future Launch Cleanup',
      status: 'service_created',
      nextActorRole: 'crew',
      nextActorId: IDS.crew,
      creatorId: IDS.customer,
      creatorRole: 'customer',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: IDS.crew,
      assignedWarehouse: null,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-10, 12, 0),
      expectedDate: atUtcDayOffset(21, 15, 0),
      serviceStartDate: atUtcDayOffset(21, 15, 0),
      deliveryDate: null,
      totalAmount: 460,
      transformedId: 'CEN-001-TEST-SRV-008',
      rejectionReason: null,
      notes: 'Far-future event for month-view density.',
      metadata: {
        serviceStartDate: atUtcDayOffset(21, 15, 0),
        serviceEndDate: atUtcDayOffset(21, 18, 0),
        serviceStatus: 'scheduled',
        crew: [IDS.crew],
      },
      participants: buildParticipants({
        creatorId: IDS.customer,
        creatorRole: 'customer',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: IDS.crew,
        assignedWarehouse: null,
      }),
      items: [serviceLine('Far Future Launch Cleanup', 460)],
      service: {
        serviceId: 'CEN-001-TEST-SRV-008',
        serviceName: 'Far Future Launch Cleanup',
        category: 'launch',
        description: 'Far-future service fixture.',
        pricingModel: 'flat',
        requirements: 'Crew assigned',
        status: 'active',
        managedBy: IDS.manager,
      },
    },
  ];

  const productFixtures: FixtureOrder[] = [
    {
      orderId: 'CEN-001-TEST-PO-101',
      orderType: 'product',
      title: 'PPE Replenishment',
      status: 'pending_warehouse',
      nextActorRole: 'warehouse',
      nextActorId: IDS.warehouse,
      creatorId: IDS.center,
      creatorRole: 'center',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-1, 12, 0),
      expectedDate: atUtcDayOffset(1, 18, 0),
      serviceStartDate: null,
      deliveryDate: null,
      totalAmount: 96,
      transformedId: null,
      rejectionReason: null,
      notes: 'Warehouse-pending delivery fixture.',
      metadata: {
        deliveryWindow: 'afternoon',
        deliveryStarted: false,
      },
      participants: buildParticipants({
        creatorId: IDS.center,
        creatorRole: 'center',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('PPE Replenishment', 12, 8)],
    },
    {
      orderId: 'CUS-001-TEST-PO-102',
      orderType: 'product',
      title: 'Janitorial Supply Delivery',
      status: 'awaiting_delivery',
      nextActorRole: 'warehouse',
      nextActorId: IDS.warehouse,
      creatorId: IDS.customer,
      creatorRole: 'customer',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-2, 14, 30),
      expectedDate: atUtcDayOffset(2, 19, 0),
      serviceStartDate: null,
      deliveryDate: null,
      totalAmount: 180,
      transformedId: null,
      rejectionReason: null,
      notes: 'Scheduled delivery fixture.',
      metadata: {
        deliveryWindow: 'evening',
        deliveryStarted: false,
      },
      participants: buildParticipants({
        creatorId: IDS.customer,
        creatorRole: 'customer',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('Janitorial Supply Delivery', 18, 10)],
    },
    {
      orderId: 'WHS-001-TEST-PO-103',
      orderType: 'product',
      title: 'Emergency Restock Run',
      status: 'awaiting_delivery',
      nextActorRole: 'warehouse',
      nextActorId: IDS.warehouse,
      creatorId: IDS.warehouse,
      creatorRole: 'warehouse',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(0, 12, 0),
      expectedDate: atUtcDayOffset(0, 20, 0),
      serviceStartDate: null,
      deliveryDate: null,
      totalAmount: 140,
      transformedId: null,
      rejectionReason: null,
      notes: 'In-progress delivery fixture.',
      metadata: {
        deliveryWindow: 'urgent',
        deliveryStarted: true,
      },
      participants: buildParticipants({
        creatorId: IDS.warehouse,
        creatorRole: 'warehouse',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('Emergency Restock Run', 10, 14)],
    },
    {
      orderId: 'CON-001-TEST-PO-104',
      orderType: 'product',
      title: 'Delivered Floor Mats',
      status: 'delivered',
      nextActorRole: null,
      nextActorId: null,
      creatorId: IDS.contractor,
      creatorRole: 'contractor',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-4, 12, 0),
      expectedDate: atUtcDayOffset(-1, 18, 0),
      serviceStartDate: null,
      deliveryDate: atUtcDayOffset(-1, 18, 20),
      totalAmount: 225,
      transformedId: null,
      rejectionReason: null,
      notes: 'Completed delivery fixture.',
      metadata: {
        deliveryWindow: 'completed',
        deliveryStarted: true,
      },
      participants: buildParticipants({
        creatorId: IDS.contractor,
        creatorRole: 'contractor',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('Delivered Floor Mats', 15, 15)],
    },
    {
      orderId: 'CUS-001-TEST-PO-105',
      orderType: 'product',
      title: 'Cancelled Paper Goods Transfer',
      status: 'cancelled',
      nextActorRole: null,
      nextActorId: null,
      creatorId: IDS.customer,
      creatorRole: 'customer',
      customerId: IDS.customer,
      centerId: IDS.center,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.center,
      destinationRole: 'center',
      requestedDate: atUtcDayOffset(-1, 10, 0),
      expectedDate: atUtcDayOffset(4, 16, 0),
      serviceStartDate: null,
      deliveryDate: null,
      totalAmount: 88,
      transformedId: null,
      rejectionReason: 'Order no longer required.',
      notes: 'Cancelled delivery fixture.',
      metadata: {
        deliveryWindow: 'cancelled',
        deliveryStarted: false,
      },
      participants: buildParticipants({
        creatorId: IDS.customer,
        creatorRole: 'customer',
        destination: IDS.center,
        destinationRole: 'center',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: IDS.center,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('Cancelled Paper Goods Transfer', 11, 8)],
    },
    {
      orderId: 'CUS-001-TEST-PO-106',
      orderType: 'product',
      title: 'Direct Customer Sample Drop',
      status: 'delivered',
      nextActorRole: null,
      nextActorId: null,
      creatorId: IDS.customer,
      creatorRole: 'customer',
      customerId: IDS.customer,
      centerId: null,
      contractorId: IDS.contractor,
      managerId: IDS.manager,
      crewId: null,
      assignedWarehouse: IDS.warehouse,
      destination: IDS.customer,
      destinationRole: 'customer',
      requestedDate: atUtcDayOffset(-3, 12, 0),
      expectedDate: atUtcDayOffset(0, 15, 30),
      serviceStartDate: null,
      deliveryDate: atUtcDayOffset(0, 15, 45),
      totalAmount: 54,
      transformedId: null,
      rejectionReason: null,
      notes: 'Customer-direct delivery fixture with no center visibility.',
      metadata: {
        deliveryWindow: 'customer-direct',
        deliveryStarted: true,
      },
      participants: buildParticipants({
        creatorId: IDS.customer,
        creatorRole: 'customer',
        destination: IDS.customer,
        destinationRole: 'customer',
        managerId: IDS.manager,
        contractorId: IDS.contractor,
        customerId: IDS.customer,
        centerId: null,
        crewId: null,
        assignedWarehouse: IDS.warehouse,
      }),
      items: [productLine('Direct Customer Sample Drop', 6, 9)],
    },
  ];

  return [...serviceFixtures, ...productFixtures];
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
    throw new Error('TEST ecosystem is missing. Run the TEST ecosystem seed before calendar enrichment.');
  }
}

async function upsertService(service: FixtureService): Promise<void> {
  await query(
    `
      INSERT INTO services (
        service_id,
        service_name,
        category,
        description,
        pricing_model,
        requirements,
        status,
        managed_by,
        actual_start_time,
        actual_end_time,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz, NOW(), NOW()
      )
      ON CONFLICT (service_id) DO UPDATE SET
        service_name = EXCLUDED.service_name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        pricing_model = EXCLUDED.pricing_model,
        requirements = EXCLUDED.requirements,
        status = EXCLUDED.status,
        managed_by = EXCLUDED.managed_by,
        actual_start_time = EXCLUDED.actual_start_time,
        actual_end_time = EXCLUDED.actual_end_time,
        updated_at = NOW()
    `,
    [
      service.serviceId,
      service.serviceName,
      service.category,
      service.description,
      service.pricingModel,
      service.requirements,
      service.status,
      service.managedBy,
      service.actualStartTime ?? null,
      service.actualEndTime ?? null,
    ],
  );
}

async function upsertOrder(order: FixtureOrder): Promise<void> {
  await query(
    `
      INSERT INTO orders (
        order_id,
        order_type,
        title,
        status,
        next_actor_role,
        creator_id,
        creator_role,
        customer_id,
        center_id,
        contractor_id,
        manager_id,
        crew_id,
        assigned_warehouse,
        destination,
        destination_role,
        requested_date,
        expected_date,
        service_start_date,
        delivery_date,
        total_amount,
        currency,
        transformed_id,
        rejection_reason,
        notes,
        metadata,
        next_actor_id,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16::timestamptz, $17::timestamptz, $18::timestamptz, $19::timestamptz,
        $20, 'USD', $21, $22, $23, $24::jsonb, $25, NOW(), NOW()
      )
      ON CONFLICT (order_id) DO UPDATE SET
        order_type = EXCLUDED.order_type,
        title = EXCLUDED.title,
        status = EXCLUDED.status,
        next_actor_role = EXCLUDED.next_actor_role,
        creator_id = EXCLUDED.creator_id,
        creator_role = EXCLUDED.creator_role,
        customer_id = EXCLUDED.customer_id,
        center_id = EXCLUDED.center_id,
        contractor_id = EXCLUDED.contractor_id,
        manager_id = EXCLUDED.manager_id,
        crew_id = EXCLUDED.crew_id,
        assigned_warehouse = EXCLUDED.assigned_warehouse,
        destination = EXCLUDED.destination,
        destination_role = EXCLUDED.destination_role,
        requested_date = EXCLUDED.requested_date,
        expected_date = EXCLUDED.expected_date,
        service_start_date = EXCLUDED.service_start_date,
        delivery_date = EXCLUDED.delivery_date,
        total_amount = EXCLUDED.total_amount,
        transformed_id = EXCLUDED.transformed_id,
        rejection_reason = EXCLUDED.rejection_reason,
        notes = EXCLUDED.notes,
        metadata = EXCLUDED.metadata,
        next_actor_id = EXCLUDED.next_actor_id,
        updated_at = NOW()
    `,
    [
      order.orderId,
      order.orderType,
      order.title,
      order.status,
      order.nextActorRole,
      order.creatorId,
      order.creatorRole,
      order.customerId,
      order.centerId,
      order.contractorId,
      order.managerId,
      order.crewId,
      order.assignedWarehouse,
      order.destination,
      order.destinationRole,
      order.requestedDate,
      order.expectedDate,
      order.serviceStartDate,
      order.deliveryDate,
      order.totalAmount,
      order.transformedId,
      order.rejectionReason,
      order.notes,
      JSON.stringify(order.metadata),
      order.nextActorId,
    ],
  );
}

async function replaceOrderItems(order: FixtureOrder): Promise<void> {
  await query(`DELETE FROM order_items WHERE order_id = $1`, [order.orderId]);
  for (const [index, item] of order.items.entries()) {
    await query(
      `
        INSERT INTO order_items (
          order_id,
          line_number,
          catalog_item_code,
          name,
          item_type,
          description,
          quantity,
          unit_of_measure,
          unit_price,
          currency,
          total_price,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, 'USD', $10, '{}'::jsonb
        )
      `,
      [
        order.orderId,
        index + 1,
        item.catalogItemCode,
        item.name,
        item.itemType,
        item.description,
        item.quantity,
        item.unitOfMeasure,
        item.unitPrice,
        lineTotal(item),
      ],
    );
  }
}

async function replaceParticipants(order: FixtureOrder): Promise<void> {
  await query(`DELETE FROM order_participants WHERE order_id = $1`, [order.orderId]);
  for (const participant of order.participants) {
    await query(
      `
        INSERT INTO order_participants (
          order_id,
          participant_id,
          participant_role,
          participation_type
        ) VALUES ($1, $2, $3, $4)
      `,
      [order.orderId, participant.participantId, participant.participantRole, participant.participationType],
    );
  }
}

async function seedFixtures(fixtures: FixtureOrder[]): Promise<void> {
  await withTransaction(async () => {
    for (const fixture of fixtures) {
      if (fixture.service) {
        await upsertService(fixture.service);
      }
      await upsertOrder(fixture);
      await replaceOrderItems(fixture);
      await replaceParticipants(fixture);
    }
  });

  for (const fixture of fixtures) {
    await syncOrderCalendarProjection(fixture.orderId);
  }
}

async function summarize(fixtures: FixtureOrder[]): Promise<void> {
  const orderIds = fixtures.map((fixture) => fixture.orderId);
  const summary = await query<{ event_type: string; status: string; count: string }>(
    `
      SELECT event_type, status, COUNT(*)::text AS count
      FROM calendar_events
      WHERE source_id = ANY($1::text[]) OR COALESCE(metadata->>'orderId', '') = ANY($1::text[])
      GROUP BY event_type, status
      ORDER BY event_type, status
    `,
    [orderIds],
  );

  console.log(`Seeded ${fixtures.length} TEST orders for calendar verification.`);
  for (const row of summary.rows) {
    console.log(`- ${row.event_type} / ${row.status}: ${row.count}`);
  }
}

async function main(): Promise<void> {
  await ensureTestEcosystemExists();
  const fixtures = buildFixtures();
  await seedFixtures(fixtures);
  await summarize(fixtures);
}

main().catch((error) => {
  console.error('[seed-calendar-test-fixtures] failed', error);
  process.exitCode = 1;
});
