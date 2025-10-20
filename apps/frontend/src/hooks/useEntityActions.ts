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
    const actionLabel = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    toast.success(`Order ${backendAction}ed successfully`);

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
 * TODO: Implement when service actions are needed
 */
async function handleServiceAction(
  _serviceId: string,
  _actionId: string,
  _options: EntityActionOptions,
  _mutate: any
): Promise<boolean> {
  console.warn('[useEntityActions] Service actions not yet implemented');
  return false;
}

/**
 * Handle Report/Feedback Actions
 * TODO: Implement when report actions are needed
 */
async function handleReportAction(
  _reportId: string,
  _actionId: string,
  _subtype: string | undefined,
  _options: EntityActionOptions,
  _mutate: any
): Promise<boolean> {
  console.warn('[useEntityActions] Report actions not yet implemented');
  return false;
}
