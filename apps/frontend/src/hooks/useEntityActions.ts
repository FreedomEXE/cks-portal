/**
 * useEntityActions - Centralized Entity Action Handler
 *
 * Consolidates all entity action logic into one place.
 * Replaces ~350 lines of duplicate code across 7 hubs.
 *
 * Usage:
 * ```tsx
 * const { handleAction } = useEntityActions();
 *
 * // In modal
 * <Button onClick={() => handleAction('CRW-006-PO-110', 'Accept')}>
 *   Accept Order
 * </Button>
 * ```
 */

import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import toast from 'react-hot-toast';
import { parseEntityId } from '../shared/utils/parseEntityId';
import { applyHubOrderAction, type OrderActionRequest } from '../shared/api/hub';

export interface EntityActionOptions {
  notes?: string;
  transformedId?: string;
  metadata?: Record<string, unknown>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseEntityActionsReturn {
  handleAction: (entityId: string, action: string, options?: EntityActionOptions) => Promise<boolean>;
  isProcessing: boolean;
}

export function useEntityActions(): UseEntityActionsReturn {
  const { mutate } = useSWRConfig();

  const handleAction = useCallback(
    async (entityId: string, action: string, options: EntityActionOptions = {}): Promise<boolean> => {
      try {
        const { type, subtype } = parseEntityId(entityId);

        // Normalize action label to action ID
        // Backend expects lowercase action IDs like "accept", "reject", "cancel"
        const actionId = action.toLowerCase().replace(/\s+/g, '_');

        // Handle different entity types
        if (type === 'order') {
          return await handleOrderAction(entityId, actionId, options, mutate);
        }

        if (type === 'service') {
          return await handleServiceAction(entityId, actionId, options, mutate);
        }

        if (type === 'report') {
          return await handleReportAction(entityId, actionId, subtype, options, mutate);
        }

        // Unsupported entity type
        console.warn(`[useEntityActions] Unsupported entity type: ${type}`);
        return false;

      } catch (error) {
        console.error('[useEntityActions] Action failed:', error);
        options.onError?.(error as Error);
        return false;
      }
    },
    [mutate]
  );

  return {
    handleAction,
    isProcessing: false // TODO: Add loading state if needed
  };
}

/**
 * Handle Order Actions
 */
async function handleOrderAction(
  orderId: string,
  actionId: string,
  options: EntityActionOptions,
  mutate: any
): Promise<boolean> {
  // Import archive API for archive/restore/delete actions
  const { archiveAPI } = await import('../shared/api/archive');

  // Handle archive/restore/delete actions (admin only)
  if (actionId === 'archive' || actionId === 'restore' || actionId === 'delete') {
    try {
      switch (actionId) {
        case 'archive': {
          const reason = options.notes;
          console.log('[useEntityActions] Archiving order:', orderId);
          await archiveAPI.archiveEntity('order', orderId, reason || undefined);

          // Invalidate caches
          mutate((key: any) => {
            if (typeof key === 'string') {
              return key.includes('/hub/orders/') ||
                     key.includes('/admin/directory/orders') ||
                     key.includes('/admin/directory/activities') ||
                     key.includes('/api/hub/activities') ||
                     key.includes('/hub/activities') ||
                     key.includes('/api/archive/list') ||
                     key.includes('/archive/list') ||
                     key.includes(orderId);
            }
            return false;
          });

          // Dispatch event for non-SWR components (e.g., ArchiveSection)
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'order', entityId: orderId, action: 'archive' }
          }));

          console.log('[useEntityActions] Order archive: success');
          toast.success('Order archived successfully');
          options.onSuccess?.();
          return true;
        }

        case 'restore': {
          console.log('[useEntityActions] Restoring order:', orderId);
          await archiveAPI.restoreEntity('order', orderId);

          // Invalidate caches
          mutate((key: any) => {
            if (typeof key === 'string') {
              return key.includes('/hub/orders/') ||
                     key.includes('/admin/directory/orders') ||
                     key.includes('/admin/directory/activities') ||
                     key.includes('/api/hub/activities') ||
                     key.includes('/hub/activities') ||
                     key.includes('/api/archive/list') ||
                     key.includes('/archive/list') ||
                     key.includes('/archive') ||
                     key.includes(orderId);
            }
            return false;
          });

          // Dispatch event for non-SWR components (e.g., ArchiveSection)
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'order', entityId: orderId, action: 'restore' }
          }));

          console.log('[useEntityActions] Order restore: success');
          toast.success('Order restored successfully');
          options.onSuccess?.();
          return true;
        }

        case 'delete': {
          const reason = options.notes;
          console.log('[useEntityActions] Permanently deleting order:', orderId);
          await archiveAPI.hardDelete('order', orderId, reason);

          // Invalidate caches
          mutate((key: any) => {
            if (typeof key === 'string') {
              return key.includes('/archive') ||
                     key.includes('/admin/directory/activities') ||
                     key.includes('/api/hub/activities') ||
                     key.includes('/hub/activities') ||
                     key.includes('/api/archive/list') ||
                     key.includes('/archive/list') ||
                     key.includes('/api/archive/relationships') ||
                     key.includes(orderId);
            }
            return false;
          });

          // Dispatch event for non-SWR components (e.g., ArchiveSection)
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'order', entityId: orderId, action: 'hard_delete' }
          }));

          console.log('[useEntityActions] Order delete: success');
          toast.success('Order permanently deleted');
          options.onSuccess?.();
          return true;
        }
      }
    } catch (error) {
      console.error(`[useEntityActions] Order ${actionId} failed:`, error);
      toast.error(`Failed to ${actionId} order`);
      throw error;
    }
  }

  // Map common action labels to backend actions
  let backendAction = actionId;

  // Handle action-specific logic
  switch (actionId) {
    case 'accept':
    case 'approve':
      backendAction = 'accept';
      break;

    case 'reject':
    case 'decline':
      backendAction = 'reject';
      // Prompt for reason if not provided
      if (!options.notes) {
        const reason = window.prompt('Please provide a reason for rejection:')?.trim();
        if (!reason) {
          alert('A reason is required to reject.');
          return false;
        }
        options.notes = reason;
      }
      break;

    case 'cancel':
      backendAction = 'cancel';
      // Confirm cancellation
      if (!window.confirm('Are you sure you want to cancel this order?')) {
        return false;
      }
      // Optional cancellation reason
      if (!options.notes) {
        const reason = window.prompt('Optional: Provide a reason for cancellation')?.trim();
        if (reason) {
          options.notes = reason;
        }
      }
      break;

    case 'create_service':
      backendAction = 'create_service';
      // transformedId should be provided in options
      break;

    case 'view_details':
      // Not an action, just ignore
      return true;

    default:
      // Pass through other actions as-is
      backendAction = actionId;
  }

  // Build payload
  const payload: OrderActionRequest = {
    action: backendAction as any,
    ...(options.notes ? { notes: options.notes } : {}),
    ...(options.transformedId ? { transformedId: options.transformedId } : {}),
    ...(options.metadata ? { metadata: options.metadata } : {})
  };

  try {
    // Call backend
    console.log(`[useEntityActions] Calling order action: ${actionId} on ${orderId}`, payload);
    const result = await applyHubOrderAction(orderId, payload);
    console.log(`[useEntityActions] Order action succeeded:`, result);

    // Success - invalidate all related caches
    mutate((key: any) => {
      if (typeof key === 'string') {
        return key.includes('/hub/orders/') || key.includes(orderId);
      }
      return false;
    });

    options.onSuccess?.();
    console.log(`[useEntityActions] Order action "${actionId}" completed successfully`);

    // Show success toast
    const actionLabel = actionId.charAt(0).toUpperCase() + actionId.slice(1).toLowerCase();
    toast.success(`Order ${actionLabel}ed successfully`);

    return true;

  } catch (error) {
    console.error(`[useEntityActions] Order action "${actionId}" failed:`, error);
    // Don't show alert here - let the caller handle it
    // alert(`Failed to ${actionId} order. Please try again.`);
    throw error;
  }
}

/**
 * Handle Service Actions
 */
async function handleServiceAction(
  serviceId: string,
  actionId: string,
  options: EntityActionOptions,
  mutate: any
): Promise<boolean> {
  // Import archive API
  const { archiveAPI } = await import('../shared/api/archive');

  try {
    switch (actionId) {
      case 'archive': {
        // Use reason from options (ModalGateway already prompted)
        const reason = options.notes;

        console.log('[useEntityActions] Archiving service:', serviceId);
        await archiveAPI.archiveEntity('service', serviceId, reason || undefined);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/admin/directory/services') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes(serviceId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'service', entityId: serviceId, action: 'archive' }
        }));

        console.log('[useEntityActions] Service archive: success');
        toast.success('Service archived successfully');
        options.onSuccess?.();
        return true;
      }

      case 'restore': {
        console.log('[useEntityActions] Restoring service:', serviceId);
        await archiveAPI.restoreEntity('service', serviceId);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/admin/directory/services') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes('/archive') ||
                   key.includes(serviceId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'service', entityId: serviceId, action: 'restore' }
        }));

        console.log('[useEntityActions] Service restore: success');
        toast.success('Service restored successfully');
        options.onSuccess?.();
        return true;
      }

      case 'delete': {
        // Use reason from options (ModalGateway already prompted and confirmed)
        const reason = options.notes;

        console.log('[useEntityActions] Permanently deleting service:', serviceId);
        await archiveAPI.hardDelete('service', serviceId, reason);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/archive') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes('/api/archive/relationships') ||
                   key.includes(serviceId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'service', entityId: serviceId, action: 'hard_delete' }
        }));

        console.log('[useEntityActions] Service delete: success');
        toast.success('Service permanently deleted');
        options.onSuccess?.();
        return true;
      }

      case 'start':
      case 'complete':
      case 'assign_crew':
        // TODO: Implement when backend endpoints are ready
        console.warn(`[useEntityActions] ${actionId} action not yet implemented for services`);
        toast.error(`${actionId} action not yet implemented`);
        return false;

      default:
        console.warn('[useEntityActions] Unknown action for service:', actionId);
        return false;
    }
  } catch (error) {
    console.error(`[useEntityActions] Service action "${actionId}" failed:`, error);
    toast.error(`Failed to ${actionId} service`);
    throw error;
  }
}

/**
 * Handle Report/Feedback Actions
 */
async function handleReportAction(
  reportId: string,
  actionId: string,
  subtype: string | undefined,
  options: EntityActionOptions,
  mutate: any
): Promise<boolean> {
  // Import archive API
  const { archiveAPI } = await import('../shared/api/archive');

  // Determine entity type (report vs feedback)
  const entityType = subtype === 'feedback' ? 'feedback' : 'report';
  const entityLabel = entityType === 'feedback' ? 'Feedback' : 'Report';

  try {
    switch (actionId) {
      case 'archive': {
        // Use reason from options (ModalGateway already prompted)
        const reason = options.notes;

        console.log(`[useEntityActions] Archiving ${entityType}:`, reportId);
        await archiveAPI.archiveEntity(entityType, reportId, reason || undefined);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/admin/directory/reports') ||
                   key.includes('/admin/directory/feedback') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes(reportId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: reportId, action: 'archive' }
        }));

        console.log(`[useEntityActions] ${entityLabel} archive: success`);
        toast.success(`${entityLabel} archived successfully`);
        options.onSuccess?.();
        return true;
      }

      case 'restore': {
        console.log(`[useEntityActions] Restoring ${entityType}:`, reportId);
        await archiveAPI.restoreEntity(entityType, reportId);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/admin/directory/reports') ||
                   key.includes('/admin/directory/feedback') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes('/archive') ||
                   key.includes(reportId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: reportId, action: 'restore' }
        }));

        console.log(`[useEntityActions] ${entityLabel} restore: success`);
        toast.success(`${entityLabel} restored successfully`);
        options.onSuccess?.();
        return true;
      }

      case 'delete': {
        // Use reason from options (ModalGateway already prompted and confirmed)
        const reason = options.notes;

        console.log(`[useEntityActions] Permanently deleting ${entityType}:`, reportId);
        await archiveAPI.hardDelete(entityType, reportId, reason);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/archive') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes('/api/archive/list') ||
                   key.includes('/archive/list') ||
                   key.includes('/api/archive/relationships') ||
                   key.includes(reportId);
          }
          return false;
        });

        // Dispatch event for non-SWR components (e.g., ArchiveSection)
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: reportId, action: 'hard_delete' }
        }));

        console.log(`[useEntityActions] ${entityLabel} delete: success`);
        toast.success(`${entityLabel} permanently deleted`);
        options.onSuccess?.();
        return true;
      }

      case 'acknowledge':
      case 'resolve':
      case 'close':
        // TODO: Implement when backend endpoints are ready
        console.warn(`[useEntityActions] ${actionId} action not yet implemented for reports`);
        toast.error(`${actionId} action not yet implemented`);
        return false;

      default:
        console.warn(`[useEntityActions] Unknown action for ${entityType}:`, actionId);
        return false;
    }
  } catch (error) {
    console.error(`[useEntityActions] ${entityLabel} action "${actionId}" failed:`, error);
    toast.error(`Failed to ${actionId} ${entityLabel.toLowerCase()}`);
    throw error;
  }
}
