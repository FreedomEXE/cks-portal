/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: buildOrderActions.ts
 *
 * Description:
 * Shared action builder for order modals. Centralizes all action button
 * logic so hubs and components don't hardcode their own button arrays.
 * Single source of truth for "what actions are available" based on
 * order state, role, and status.
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export interface OrderActionContext {
  order: {
    orderId?: string;
    id?: string;
    status?: string;
    orderType?: string;
  };
  state: 'active' | 'archived';
  role: 'admin' | 'manager' | 'crew' | 'center' | 'contractor' | 'customer' | 'warehouse';
  callbacks: {
    onViewDetails?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
    onRestore?: () => void;
    onDelete?: () => void;
    onHardDelete?: () => void;
    onViewRelationships?: () => void;
  };
}

export interface OrderAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Builds standardized action button array for order modals.
 *
 * @param context - Order context including state, role, and callbacks
 * @returns Array of action button configurations
 */
export function buildOrderActions(context: OrderActionContext): OrderAction[] {
  const { order, state, callbacks } = context;
  const actions: OrderAction[] = [];

  // ARCHIVED ORDER ACTIONS (Admin only)
  if (state === 'archived') {
    // View Order Details
    if (callbacks.onViewDetails) {
      actions.push({
        label: '📄 View Order Details',
        variant: 'primary',
        onClick: callbacks.onViewDetails,
      });
    }

    // Restore Data
    if (callbacks.onRestore) {
      actions.push({
        label: 'Restore Data',
        variant: 'primary',
        onClick: callbacks.onRestore,
      });
    }

    // View Relationships
    if (callbacks.onViewRelationships) {
      actions.push({
        label: '🔗 View Relationships',
        variant: 'secondary',
        onClick: callbacks.onViewRelationships,
      });
    }

    // Permanently Delete
    if (callbacks.onHardDelete) {
      actions.push({
        label: '⚠️ Permanently Delete',
        variant: 'danger',
        onClick: callbacks.onHardDelete,
      });
    }

    return actions;
  }

  // ACTIVE ORDER ACTIONS
  const status = (order?.status || '').toString().trim().toLowerCase();
  const finalStatuses = new Set([
    'delivered',
    'cancelled',
    'rejected',
    'completed',
    'service-created',
    'service_created',
  ]);
  const canEdit = !finalStatuses.has(status);

  // View Details
  if (callbacks.onViewDetails) {
    actions.push({
      label: 'View Details',
      variant: 'secondary',
      onClick: callbacks.onViewDetails,
    });
  }

  // Edit Order (only if status allows)
  if (canEdit && callbacks.onEdit) {
    actions.push({
      label: 'Edit Order',
      variant: 'secondary',
      onClick: callbacks.onEdit,
    });
  }

  // Cancel Order
  if (callbacks.onCancel) {
    actions.push({
      label: 'Cancel Order',
      variant: 'secondary',
      onClick: callbacks.onCancel,
    });
  }

  // Delete Order (archive)
  if (callbacks.onDelete) {
    actions.push({
      label: 'Delete Order',
      variant: 'danger',
      onClick: callbacks.onDelete,
    });
  }

  return actions;
}
