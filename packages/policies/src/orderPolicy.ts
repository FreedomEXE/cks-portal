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
    warehouse: [], // Warehouses don't handle service orders
    center: ['pending_manager', 'pending_contractor', 'pending_crew', 'service_in_progress', 'service_completed', 'rejected', 'cancelled'],
    customer: ['pending_manager', 'pending_contractor', 'pending_crew', 'service_in_progress', 'service_completed', 'rejected', 'cancelled'],
    manager: ['pending_manager', 'pending_contractor', 'pending_crew', 'service_in_progress', 'service_completed', 'rejected', 'cancelled'],
    contractor: ['pending_contractor', 'pending_crew', 'service_in_progress', 'service_completed', 'rejected', 'cancelled'],
    crew: ['pending_crew', 'service_in_progress', 'service_completed', 'cancelled']
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
      'pending_warehouse': ['cancel'],
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    customer: {
      'pending_warehouse': ['cancel'],
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    manager: {
      'pending_warehouse': ['cancel'],
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    contractor: {
      'pending_warehouse': ['cancel'],
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    },
    crew: {
      'pending_warehouse': ['cancel'],
      'awaiting_delivery': [] // Can only watch after warehouse accepts
    }
  },
  service: {
    admin: {}, // Admin doesn't interact with orders
    warehouse: {},
    center: {
      'pending_manager': ['cancel'],
      'pending_contractor': ['cancel'],
      'pending_crew': ['cancel']
    },
    customer: {},
    manager: {
      'pending_manager': ['accept', 'reject'],
      'service_in_progress': ['complete']
    },
    contractor: {
      'pending_contractor': ['accept', 'reject']
    },
    crew: {
      'pending_crew': ['accept', 'reject'],
      'service_in_progress': ['complete']
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
    'accept': 'pending_contractor', // Default, but depends on current status
    'reject': 'rejected',
    'start-delivery': 'pending_manager', // Not used for services
    'deliver': 'service_completed', // Not used for services
    'complete': 'service_completed',
    'cancel': 'cancelled',
    'create-service': 'service_completed'
  }
};

// Special transition logic for service accepts (depends on current status)
const SERVICE_ACCEPT_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus> = {
  'pending_manager': 'pending_contractor',
  'pending_contractor': 'pending_crew',
  'pending_crew': 'service_in_progress',
  'service_in_progress': 'service_in_progress', // No-op
  'service_completed': 'service_completed', // No-op
  'rejected': 'rejected', // No-op
  'cancelled': 'cancelled' // No-op
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function isFinalStatus(status: OrderStatus): boolean {
  return ['delivered', 'service_completed', 'rejected', 'cancelled'].includes(status);
}

export function isCompletedStatus(status: OrderStatus): boolean {
  return ['delivered', 'service_completed'].includes(status);
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

  // Special case: creators can cancel their own pending orders
  if (ctx.isCreator && ctx.status.startsWith('pending_')) {
    if (!actions.includes('cancel')) {
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
    'pending_manager': 'Pending Manager',
    'pending_contractor': 'Pending Contractor',
    'pending_crew': 'Pending Crew',
    'awaiting_delivery': 'Awaiting Delivery',
    'service_in_progress': 'Service In Progress',
    'delivered': 'Completed',
    'service_completed': 'Completed',
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
  if (status === 'awaiting_delivery' || status === 'service_in_progress') return 'blue';
  return 'gray';
}

// ============================================
// POLICY VALIDATION
// ============================================

export function validatePolicyVersion(version: string): boolean {
  return version === '1.0.0'; // Update this when policy changes
}
