import type {
  HubRole,
  OrderAction,
  OrderContext,
  OrderStatus,
  OrderType,
  ServiceOrderStatus
} from './types';

// ============================================
// DATA-DRIVEN POLICY TABLES
// ============================================

// Which statuses each role can see
const VISIBLE_STATUSES: Record<OrderType, Record<HubRole, OrderStatus[]>> = {
  product: {
    admin: [], // Admin doesn't interact with orders directly
    warehouse: ['pending_warehouse', 'awaiting_delivery', 'delivered', 'rejected', 'cancelled'],
    center: ['pending_warehouse', 'awaiting_delivery', 'delivered', 'rejected', 'cancelled'],
    customer: ['pending_warehouse', 'awaiting_delivery', 'delivered', 'rejected', 'cancelled'],
    manager: [], // Managers don't handle product orders
    contractor: [],
    crew: []
  },
  service: {
    admin: [], // Admin doesn't interact with orders directly
    warehouse: ['pending_warehouse', 'warehouse_accepted', 'service_created', 'rejected', 'cancelled'], // Warehouses handle warehouse-managed services
    center: ['pending_customer', 'pending_contractor', 'pending_manager', 'pending_warehouse', 'manager_accepted', 'warehouse_accepted', 'crew_requested', 'crew_assigned', 'service_created', 'rejected', 'cancelled'],
    customer: ['pending_customer', 'pending_contractor', 'pending_manager', 'pending_warehouse', 'manager_accepted', 'warehouse_accepted', 'crew_requested', 'crew_assigned', 'service_created', 'rejected', 'cancelled'],
    manager: ['pending_customer', 'pending_contractor', 'pending_manager', 'manager_accepted', 'crew_requested', 'crew_assigned', 'service_created', 'rejected', 'cancelled'], // Managers DON'T see warehouse service statuses
    contractor: ['pending_contractor', 'pending_manager', 'pending_warehouse', 'manager_accepted', 'warehouse_accepted', 'crew_requested', 'crew_assigned', 'service_created', 'rejected', 'cancelled'],
    crew: ['crew_requested', 'crew_assigned', 'service_created', 'cancelled']
  }
};

// What actions are available for each role at each status
const ACTIONS_BY_STATUS: Record<OrderType, Record<HubRole, Partial<Record<OrderStatus, OrderAction[]>>>> = {
  product: {
    admin: {}, // Admin doesn't interact with orders
    warehouse: {
      'pending_warehouse': ['accept', 'reject'],
      'awaiting_delivery': ['start-delivery', 'deliver']
    },
    center: {
      'pending_warehouse': [], // Creator can cancel (handled by special case below)
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    customer: {
      'pending_warehouse': [], // Creator can cancel (handled by special case below)
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    manager: {
      'pending_warehouse': [], // Creator can cancel (handled by special case below)
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    contractor: {
      'pending_warehouse': [], // Creator can cancel (handled by special case below)
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    crew: {
      'pending_warehouse': [], // Creator can cancel (handled by special case below)
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    }
  },
  service: {
    admin: {}, // Admin doesn't interact with orders
    warehouse: {
      'pending_warehouse': ['accept', 'reject'], // Warehouse approves warehouse-managed services
      'warehouse_accepted': [] // Service already accepted/created
    },
    center: {
      'pending_customer': [], // Creator can cancel (handled by special case)
      'pending_contractor': [], // Creator can cancel (handled by special case)
      'pending_manager': [], // Creator can cancel (handled by special case)
      'pending_warehouse': [], // Creator can cancel (handled by special case)
      'manager_accepted': [], // Only manager can act here
      'warehouse_accepted': [] // Only warehouse can act here
    },
    customer: {
      'pending_customer': ['accept', 'reject'], // Customer approves center-created orders
      'pending_contractor': [], // Creator can cancel (handled by special case)
      'pending_manager': [], // Creator can cancel (handled by special case)
      'pending_warehouse': [], // Creator can cancel (handled by special case)
      'manager_accepted': [], // Only manager can act here
      'warehouse_accepted': [] // Only warehouse can act here
    },
    manager: {
      'pending_customer': [], // Watch only
      'pending_contractor': [], // Watch only
      'pending_manager': ['accept', 'reject'], // Manager approves (auto-creates service)
      'manager_accepted': [], // Legacy state - no longer used
      'crew_requested': [], // Legacy state - no longer used
      'crew_assigned': [] // Legacy state - no longer used
    },
    contractor: {
      'pending_contractor': ['accept', 'reject'], // Contractor approves
      'pending_manager': [], // Creator can cancel (handled by special case)
      'pending_warehouse': [], // Creator can cancel (handled by special case)
      'manager_accepted': [], // Only manager can act here
      'warehouse_accepted': [] // Only warehouse can act here
    },
    crew: {
      'crew_requested': ['accept', 'reject'], // Crew accepts/rejects assignment
      'crew_assigned': [], // Already assigned
      'service_created': [] // Service completed
    }
  }
};

// State transitions for each action
const TRANSITIONS: Record<OrderType, Record<OrderAction, OrderStatus>> = {
  product: {
    'accept': 'awaiting_delivery',
    'reject': 'rejected',
    'start-delivery': 'awaiting_delivery', // Stays in awaiting_delivery, just tracks metadata
    'deliver': 'delivered',
    'cancel': 'cancelled',
    'complete': 'delivered', // Not used for products
    'create-service': 'delivered' // Not used for products
  },
  service: {
    'accept': 'pending_contractor', // Default, but depends on current status (see SERVICE_ACCEPT_TRANSITIONS)
    'reject': 'rejected',
    'start-delivery': 'pending_manager', // Not used for services
    'deliver': 'service_created', // Not used for services
    'complete': 'service_created',
    'cancel': 'cancelled',
    'create-service': 'service_created' // Manager creates service → terminal state
  }
};

// Special transition logic for service accepts (depends on current status)
// NOTE: pending_contractor can go to either pending_manager OR pending_warehouse
// This is determined at runtime based on the service's managed_by field
const SERVICE_ACCEPT_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus> = {
  'pending_customer': 'pending_contractor',      // Customer accepts → Contractor
  'pending_contractor': 'pending_manager',       // Contractor accepts → Manager (default, or warehouse if managed_by=warehouse)
  'pending_manager': 'service_created',          // Manager accepts → Service auto-created, order archived
  'pending_warehouse': 'service_created',        // Warehouse accepts → Service auto-created, order archived
  'manager_accepted': 'service_created',         // Legacy: Manager creates service manually
  'warehouse_accepted': 'service_created',       // Legacy: Warehouse creates service manually
  'crew_requested': 'crew_assigned',             // Crew accepts assignment
  'crew_assigned': 'crew_assigned',              // No-op
  'service_created': 'service_created',          // No-op
  'rejected': 'rejected',                        // No-op
  'cancelled': 'cancelled'                       // No-op
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isFinalStatus(status: OrderStatus): boolean {
  return ['delivered', 'service_created', 'rejected', 'cancelled'].includes(status);
}

export function isCompletedStatus(status: OrderStatus): boolean {
  return ['delivered', 'service_created'].includes(status);
}

// ============================================
// CORE POLICY FUNCTIONS
// ============================================

export function getVisibleStatuses(role: HubRole, orderType: OrderType): OrderStatus[] {
  return VISIBLE_STATUSES[orderType]?.[role] ?? [];
}

export function getAllowedActions(ctx: OrderContext): OrderAction[] {
  // No actions on final statuses
  if (isFinalStatus(ctx.status)) {
    return [];
  }

  // Get role-specific actions for this status
  const actions = ACTIONS_BY_STATUS[ctx.orderType]?.[ctx.role]?.[ctx.status] ?? [];

  // Product flow: creator can cancel before warehouse accepts
  if (ctx.orderType === 'product' && ctx.status === 'pending_warehouse') {
    if (ctx.isCreator === true && !actions.includes('cancel')) {
      return [...actions, 'cancel'];
    }
  }

  // Product flow: warehouse can cancel after accepting but before delivery starts
  if (ctx.orderType === 'product' && ctx.status === 'awaiting_delivery' && ctx.role === 'warehouse') {
    if (!actions.includes('cancel')) {
      return [...actions, 'cancel'];
    }
  }

  // Service flow: staged cancel rights follow the last actor who has acted.
  // - pending_customer: creator can cancel
  // - pending_contractor: customer (who accepted) can cancel
  // - pending_manager: contractor (who accepted) can cancel
  // - manager_accepted: manager can cancel (optional)
  if (ctx.orderType === 'service' && ctx.participants) {
    const hasRoleUser = (role: HubRole) => ctx.participants!.some(p => p.role === role && p.userId === ctx.userId);
    let canCancel = false;
    switch (ctx.status) {
      case 'pending_customer':
        canCancel = ctx.isCreator === true || hasRoleUser('center') || hasRoleUser('customer');
        break;
      case 'pending_contractor':
        canCancel = hasRoleUser('customer');
        break;
      case 'pending_manager':
        canCancel = hasRoleUser('contractor');
        break;
      case 'manager_accepted':
        canCancel = hasRoleUser('manager');
        break;
    }
    if (canCancel && !actions.includes('cancel')) {
      return [...actions, 'cancel'];
    }
  }

  return actions;
}

export function getNextStatus(
  orderType: OrderType,
  currentStatus: OrderStatus,
  action: OrderAction
): OrderStatus | null {
  // Handle special case for service accept transitions
  if (orderType === 'service' && action === 'accept') {
    return SERVICE_ACCEPT_TRANSITIONS[currentStatus as ServiceOrderStatus] ?? null;
  }

  return TRANSITIONS[orderType]?.[action] ?? null;
}

export function canTransition(
  ctx: OrderContext,
  action: OrderAction
): { allowed: boolean; reason?: string } {
  // Check if action is allowed
  const allowedActions = getAllowedActions(ctx);
  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: `Action '${action}' not allowed for role '${ctx.role}' at status '${ctx.status}'`
    };
  }

  // Check if transition is valid
  const nextStatus = getNextStatus(ctx.orderType, ctx.status, action);
  if (!nextStatus) {
    return {
      allowed: false,
      reason: `No valid transition for action '${action}' from status '${ctx.status}'`
    };
  }

  return { allowed: true };
}

// ============================================
// UI HELPER FUNCTIONS
// ============================================

export function getActionLabel(action: OrderAction): string {
  const labels: Record<OrderAction, string> = {
    'accept': 'Accept',
    'reject': 'Reject',
    'start-delivery': 'Start Delivery',
    'deliver': 'Mark Delivered',
    'complete': 'Complete',
    'cancel': 'Cancel',
    'create-service': 'Create Service'
  };
  return labels[action] ?? action;
}

export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    'pending_warehouse': 'Pending Warehouse',
    'pending_customer': 'Pending Customer',
    'pending_contractor': 'Pending Contractor',
    'pending_manager': 'Pending Manager',
    'manager_accepted': 'Manager Accepted',
    'warehouse_accepted': 'Warehouse Accepted',
    'crew_requested': 'Crew Requested',
    'crew_assigned': 'Crew Assigned',
    'awaiting_delivery': 'Awaiting Delivery',
    'delivered': 'Completed',
    'service_created': 'Completed',
    'rejected': 'Rejected',
    'cancelled': 'Cancelled'
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: OrderStatus): string {
  if (isCompletedStatus(status)) return 'green';
  if (status === 'rejected') return 'red';
  if (status === 'cancelled') return 'gray';
  if (status.startsWith('pending_')) return 'yellow';
  if (status === 'awaiting_delivery') return 'blue';
  if (status === 'manager_accepted' || status === 'crew_requested' || status === 'crew_assigned') return 'blue';
  return 'gray';
}

// ============================================
// POLICY VALIDATION
// ============================================

export function validatePolicyVersion(version: string): boolean {
  return version === '1.0.0'; // Update this when policy changes
}
