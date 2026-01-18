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
import { useAuth as useClerkAuth, useSignIn, useClerk } from '@clerk/clerk-react';
import { parseEntityId } from '../shared/utils/parseEntityId';
import { applyHubOrderAction, type OrderActionRequest, acknowledgeItem, resolveReport, applyServiceAction, requestServiceCrew, respondToServiceCrew, respondToOrderCrew, respondToCrewInvite } from '../shared/api/hub';
import { archiveAPI } from '../shared/api/archive';
import { createImpersonationToken, sendUserInvite, updateCatalogService } from '../shared/api/admin';

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
  const { getToken, isSignedIn } = useClerkAuth();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { signOut } = useClerk();

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

        // User entities: manager | contractor | customer | center | crew | warehouse
        if (type === 'user') {
          return await handleUserAction(entityId, actionId, subtype, options, mutate, {
            getToken,
            signInLoaded,
            signIn,
            setActive,
            signOut,
            isSignedIn,
          });
        }

        if (type === 'product') {
          return await handleProductAction(entityId, actionId, options, mutate);
        }

        if (type === 'catalogService') {
          return await handleCatalogServiceAction(entityId, actionId, options, mutate);
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
    [getToken, mutate, setActive, signIn, signInLoaded, signOut, isSignedIn]
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
                       key.includes('/admin/directory/orders') ||
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
    case 'create-service':
      // Backend expects hyphenated action id
      backendAction = 'create-service';
      // transformedId should be provided in options (or returned by backend)
      break;

    // Warehouse delivery flow aliases
    case 'start_delivery':
    case 'start-delivery':
      // Backend expects hyphenated action id
      backendAction = 'start-delivery';
      break;

    case 'complete_delivery':
    case 'mark_delivered':
    case 'deliver':
      // Normalize to backend 'deliver'
      backendAction = 'deliver';
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

    // Crew responding to order-level invite uses a dedicated endpoint
    const crewMetadata = (options as any)?.metadata as Record<string, any> | undefined;
    const isCrewResponse = (options as any)?.crewResponse === true || crewMetadata?.crewResponse === true;
    if ((actionId === 'accept' || actionId === 'reject') && isCrewResponse) {
      const accepted = actionId === 'accept';
      const serviceId = crewMetadata?.serviceId || crewMetadata?.transformedId || crewMetadata?.service?.serviceId || crewMetadata?.service_id;
      await respondToCrewInvite(orderId, serviceId, accepted);

      // Invalidate caches and toast
      mutate((key: any) => {
        if (typeof key === 'string') {
          return key.includes('/hub/orders/') ||
                 key.includes('/api/hub/activities') ||
                 key.includes('/hub/activities') ||
                 key.includes(orderId);
        }
        return false;
      });
      toast.success(accepted ? 'Invite accepted' : 'Invite declined');
      options.onSuccess?.();
      return true;
    }

    const result = await applyHubOrderAction(orderId, payload);
    console.log(`[useEntityActions] Order action succeeded:`, result);

    // Success - invalidate all related caches (orders + activities)
    mutate((key: any) => {
      if (typeof key === 'string') {
        return key.includes('/hub/orders/') ||
               key.includes('/api/hub/activities') ||
               key.includes('/hub/activities') ||
               key.includes(orderId);
      }
      return false;
    });

    // Special handling: after create-service, also refresh service caches
    try {
      if (backendAction === 'create-service') {
        const newServiceId = (result as any)?.transformedId || (result as any)?.serviceId || undefined;
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   (newServiceId ? key.includes(newServiceId) : false);
          }
          return false;
        });
      }
    } catch (e) {
      console.warn('[useEntityActions] Post-create-service cache refresh failed:', e);
    }

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
 * Handle Product Actions (admin)
 */
  async function handleProductAction(
  productId: string,
  actionId: string,
  options: EntityActionOptions,
  mutate: any
): Promise<boolean> {
  try {
    switch (actionId) {
      
        case 'archive': {
          const reason = options.notes;
          await archiveAPI.archiveEntity('product', productId, reason || undefined);
          mutate((key: any) => typeof key === 'string' && (
            key.includes('/admin/directory/products') ||
            key.includes('/catalog') ||
            key.includes('/api/archive/list') ||
            key.includes('/archive/list') ||
            key.includes(productId)
          ));
          // Notify archive widgets to refresh
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'product', entityId: productId, action: 'archive' }
          }));
          toast.success('Product archived successfully');
          options.onSuccess?.();
          return true;
        }
        case 'restore': {
          await archiveAPI.restoreEntity('product', productId);
          mutate((key: any) => typeof key === 'string' && (
            key.includes('/admin/directory/products') ||
            key.includes('/catalog') ||
            key.includes('/api/archive/list') ||
            key.includes('/archive/list') ||
            key.includes(productId)
          ));
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'product', entityId: productId, action: 'restore' }
          }));
          toast.success('Product restored successfully');
          options.onSuccess?.();
          return true;
        }
        case 'delete': {
          const reason = options.notes;
          await archiveAPI.hardDelete('product', productId, reason);
          mutate((key: any) => typeof key === 'string' && (
            key.includes('/admin/directory/products') ||
            key.includes('/catalog') ||
            key.includes('/api/archive/list') ||
            key.includes('/archive/list') ||
            key.includes('/api/archive/relationships') ||
            key.includes(productId)
          ));
          window.dispatchEvent(new CustomEvent('cks:archive:updated', {
            detail: { entityType: 'product', entityId: productId, action: 'hard_delete' }
          }));
          toast.success('Product permanently deleted');
          options.onSuccess?.();
          return true;
        }
      default:
        console.warn('[useEntityActions] Unknown action for product:', actionId);
        return false;
    }
  } catch (error) {
    console.error(`[useEntityActions] Product action "${actionId}" failed:`, error);
    toast.error(`Failed to ${actionId} product`);
    throw error;
  }
}

/**
 * Handle User Actions (admin)
 */
async function handleUserAction(
  userId: string,
  actionId: string,
  subtype: string | undefined,
  options: EntityActionOptions,
  mutate: any,
  impersonation: {
    getToken?: () => Promise<string | null>;
    signInLoaded: boolean;
    signIn: any;
    setActive: any;
    signOut: any;
    isSignedIn: boolean;
  }
): Promise<boolean> {
  // Map subtype to archive entity type
  const validUserTypes = new Set(['manager', 'contractor', 'customer', 'center', 'crew', 'warehouse']);
  const entityType = (subtype || '').toLowerCase();
  if (!validUserTypes.has(entityType)) {
    console.warn('[useEntityActions] Unsupported user subtype for archive:', subtype);
    return false;
  }

  try {
    switch (actionId) {
      case 'impersonate': {
        if (!impersonation.signInLoaded || !impersonation.signIn || !impersonation.setActive) {
          toast.error('Impersonation is not ready yet. Please try again.');
          return false;
        }

        const response = await createImpersonationToken(
          { entityType, entityId: userId },
          { getToken: impersonation.getToken }
        );

        const sessionId = response?.sessionId;
        const ticket = response?.token;

        if (sessionId) {
          await impersonation.setActive({ session: sessionId });
          sessionStorage.setItem('cks_impersonation_active', 'true');
          options.onSuccess?.();
          window.location.assign('/hub');
          return true;
        }
        if (!ticket) {
          toast.error('Failed to start impersonation.');
          return false;
        }

        const redirectUrl = `/impersonate?ticket=${encodeURIComponent(ticket)}`;
        if (impersonation.signOut) {
          try {
            await impersonation.signOut({ redirectUrl });
          } catch (error) {
            console.warn('[useEntityActions] Sign-out redirect failed, falling back to hard redirect.', error);
            await impersonation.signOut();
            window.location.assign(redirectUrl);
          }
          return true;
        }

        window.location.assign(redirectUrl);
        return true;
      }
      case 'invite': {
        await sendUserInvite(
          { entityType, entityId: userId },
          { getToken: impersonation.getToken }
        );
        toast.success('Invite email sent');
        options.onSuccess?.();
        return true;
      }
      case 'archive': {
        const reason = options.notes;
        await archiveAPI.archiveEntity(entityType as any, userId, reason || undefined);
        mutate((key: any) => typeof key === 'string' && (
          key.includes('/admin/directory') ||
          key.includes('/api/archive/list') ||
          key.includes('/archive/list') ||
          key.includes(userId)
        ));
        // Notify archive widgets to refresh
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: userId, action: 'archive' }
        }));
        toast.success('User archived successfully');
        options.onSuccess?.();
        return true;
      }
      case 'restore': {
        await archiveAPI.restoreEntity(entityType as any, userId);
        mutate((key: any) => typeof key === 'string' && (
          key.includes('/admin/directory') ||
          key.includes('/api/archive/list') ||
          key.includes('/archive/list') ||
          key.includes(userId)
        ));
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: userId, action: 'restore' }
        }));
        toast.success('User restored successfully');
        options.onSuccess?.();
        return true;
      }
      case 'delete': {
        const reason = options.notes;
        await archiveAPI.hardDelete(entityType as any, userId, reason);
        mutate((key: any) => typeof key === 'string' && (
          key.includes('/admin/directory') ||
          key.includes('/api/archive/list') ||
          key.includes('/archive/list') ||
          key.includes('/api/archive/relationships') ||
          key.includes(userId)
        ));
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType, entityId: userId, action: 'hard_delete' }
        }));
        toast.success('User permanently deleted');
        options.onSuccess?.();
        return true;
      }
      default:
        console.warn('[useEntityActions] Unknown action for user:', actionId);
        return false;
    }
  } catch (error) {
    console.error(`[useEntityActions] User action "${actionId}" failed:`, error);
    toast.error(`Failed to ${actionId} user`);
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
  // Archive API (statically imported)

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
                   key.includes('/admin/directory/orders') ||
                   key.includes('/admin/directory/activities') ||
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
                   key.includes('/admin/directory/orders') ||
                   key.includes('/admin/directory/activities') ||
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
                   key.includes('/admin/directory/services') ||
                   key.includes('/admin/directory/orders') ||
                   key.includes('/admin/directory/activities') ||
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
        console.log('[useEntityActions] Starting service:', serviceId);
        await applyServiceAction(serviceId, 'start', options.notes);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(serviceId);
          }
          return false;
        });

        console.log('[useEntityActions] Service started: success');
        toast.success('Service started');
        options.onSuccess?.();
        return true;

      case 'assign_crew':
        // Minimal UI: prompt for crew codes and optional message
        try {
          const codesRaw = (options?.metadata as any)?.crewCodes as string | undefined || window.prompt('Enter one or more crew codes (comma-separated):') || '';
          const message = options?.notes || window.prompt('Optional message to include with the invite:') || undefined;
          const crewCodes = codesRaw
            .split(',')
            .map((s) => s.trim().toUpperCase())
            .filter((s) => s.length > 0);

          if (crewCodes.length === 0) {
            toast.error('No crew codes provided.');
            return false;
          }

          console.log('[useEntityActions] Requesting crew:', { serviceId, crewCodes, message });
          await requestServiceCrew(serviceId, crewCodes, message);

          // Invalidate caches
          mutate((key: any) => {
            if (typeof key === 'string') {
              return key.includes('/services') ||
                     key.includes('/admin/directory/activities') ||
                     key.includes('/api/hub/activities') ||
                     key.includes('/hub/activities') ||
                     key.includes(serviceId);
            }
            return false;
          });

          toast.success('Crew request sent');
          options.onSuccess?.();
          return true;
        } catch (e) {
          console.error('[useEntityActions] assign_crew failed:', e);
          toast.error('Failed to send crew request');
          throw e;
        }

      case 'complete':
        console.log('[useEntityActions] Completing service:', serviceId);
        await applyServiceAction(serviceId, 'complete', options.notes);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(serviceId);
          }
          return false;
        });

        console.log('[useEntityActions] Service completed: success');
        toast.success('Service completed');
        options.onSuccess?.();
        return true;

      case 'cancel':
        console.log('[useEntityActions] Cancelling service:', serviceId);
        await applyServiceAction(serviceId, 'cancel', options.notes);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(serviceId);
          }
          return false;
        });

        console.log('[useEntityActions] Service cancelled: success');
        toast.success('Service cancelled');
        options.onSuccess?.();
        return true;

      case 'verify':
        console.log('[useEntityActions] Verifying service:', serviceId);
        await applyServiceAction(serviceId, 'verify', options.notes);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(serviceId);
          }
          return false;
        });

        console.log('[useEntityActions] Service verified: success');
        toast.success('Service verified');
        options.onSuccess?.();
        return true;

      case 'update-notes':
      case 'update_notes':
        console.log('[useEntityActions] Updating service notes:', serviceId);
        await applyServiceAction(serviceId, 'update-notes', options.notes);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/services') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(serviceId);
          }
          return false;
        });

        console.log('[useEntityActions] Service notes updated: success');
        toast.success('Service notes updated');
        options.onSuccess?.();
        return true;

      // Note: 'assign_crew' implemented above; no duplicate fallback here

      case 'accept':
      case 'reject':
        // Check if this is a crew response to service invite
        if ((options as any)?.metadata?.crewResponse === true) {
          const accepted = actionId === 'accept';
          console.log(`[useEntityActions] Crew ${accepted ? 'accepting' : 'declining'} service invite:`, serviceId);
          await respondToServiceCrew(serviceId, accepted);

          // Invalidate caches
          mutate((key: any) => {
            if (typeof key === 'string') {
              return key.includes('/services') ||
                     key.includes('/api/hub/activities') ||
                     key.includes('/hub/activities') ||
                     key.includes(serviceId);
            }
            return false;
          });

          console.log('[useEntityActions] Service crew response: success');
          toast.success(accepted ? 'Service invite accepted!' : 'Service invite declined');
          options.onSuccess?.();
          return true;
        }
        break;

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
 * Handle Catalog Service Actions
 */
async function handleCatalogServiceAction(
  serviceId: string,
  actionId: string,
  options: EntityActionOptions,
  mutate: any
): Promise<boolean> {
  try {
    switch (actionId) {
      case 'edit': {
        // TODO: Implement edit form/modal for catalog services
        console.warn('[useEntityActions] Edit action not yet implemented for catalog services');
        toast.error('Edit functionality coming soon');
        return false;
      }

      case 'archive': {
        const reason = options.notes;

        console.log('[useEntityActions] Archiving catalog service:', serviceId);
        await archiveAPI.archiveEntity('catalogService', serviceId, reason || undefined);

        // Also set isActive flag for immediate visibility
        try {
          await updateCatalogService(serviceId, { isActive: false });
        } catch (e) {
          console.warn('[useEntityActions] Failed to update isActive flag:', e);
        }

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/catalog') ||
                   key.includes('/admin/directory') ||
                   key.includes('/archive') ||
                   key.includes(serviceId);
          }
          return false;
        });

        // Notify archive widgets to refresh
        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'catalogService', entityId: serviceId, action: 'archive' }
        }));
        console.log('[useEntityActions] Catalog service archive: success');
        toast.success('Catalog service archived successfully');
        options.onSuccess?.();
        return true;
      }

      case 'restore': {

        console.log('[useEntityActions] Restoring catalog service:', serviceId);
        await archiveAPI.restoreEntity('catalogService', serviceId);

        // Also set isActive flag for immediate visibility
        try {
          await updateCatalogService(serviceId, { isActive: true });
        } catch (e) {
          console.warn('[useEntityActions] Failed to update isActive flag:', e);
        }

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/catalog') ||
                   key.includes('/admin/directory') ||
                   key.includes('/archive') ||
                   key.includes(serviceId);
          }
          return false;
        });

        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'catalogService', entityId: serviceId, action: 'restore' }
        }));
        console.log('[useEntityActions] Catalog service restore: success');
        toast.success('Catalog service restored successfully');
        options.onSuccess?.();
        return true;
      }

      case 'delete': {
        const reason = options.notes;

        console.log('[useEntityActions] Hard deleting catalog service:', serviceId);
        await archiveAPI.hardDelete('catalogService', serviceId, reason || undefined);

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/catalog') ||
                   key.includes('/admin/directory') ||
                   key.includes('/archive') ||
                   key.includes(serviceId);
          }
          return false;
        });

        window.dispatchEvent(new CustomEvent('cks:archive:updated', {
          detail: { entityType: 'catalogService', entityId: serviceId, action: 'hard_delete' }
        }));
        console.log('[useEntityActions] Catalog service hard delete: success');
        toast.success('Catalog service permanently deleted');
        options.onSuccess?.();
        return true;
      }

      default:
        console.warn('[useEntityActions] Unknown action for catalogService:', actionId);
        toast.error(`Action "${actionId}" not supported for catalog services`);
        return false;
    }
  } catch (error) {
    console.error(`[useEntityActions] Catalog service action "${actionId}" failed:`, error);
    toast.error(`Failed to ${actionId} catalog service`);
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
  // Archive API (statically imported)

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
                   key.includes('/admin/directory/activities') ||
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
                   key.includes('/admin/directory/activities') ||
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
                   key.includes('/admin/directory/activities') ||
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
        console.log(`[useEntityActions] Acknowledging ${entityType}:`, reportId);
        await acknowledgeItem(reportId, entityType as 'report' | 'feedback');

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/reports') ||
                   key.includes('/feedback') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(reportId);
          }
          return false;
        });

        console.log(`[useEntityActions] ${entityLabel} acknowledged: success`);
        toast.success(`${entityLabel} acknowledged`);
        options.onSuccess?.();
        return true;

      case 'resolve':
        console.log(`[useEntityActions] Resolving ${entityType}:`, reportId);
        await resolveReport(reportId, {
          notes: options.notes,
          actionTaken: options.metadata?.actionTaken as string | undefined,
        });

        // Invalidate caches
        mutate((key: any) => {
          if (typeof key === 'string') {
            return key.includes('/reports') ||
                   key.includes('/feedback') ||
                   key.includes('/admin/directory/activities') ||
                   key.includes('/api/hub/activities') ||
                   key.includes('/hub/activities') ||
                   key.includes(reportId);
          }
          return false;
        });

        console.log(`[useEntityActions] ${entityLabel} resolved: success`);
        toast.success(`${entityLabel} resolved`);
        options.onSuccess?.();
        return true;

      case 'close':
        // TODO: Implement when backend close endpoint is ready
        console.warn(`[useEntityActions] close action not yet implemented for reports`);
        toast.error(`close action not yet implemented`);
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
