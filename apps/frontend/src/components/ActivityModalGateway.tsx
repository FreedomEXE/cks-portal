import React, { useMemo } from 'react';
import { ActivityModal, type ActivityAction } from '@cks/ui';
import { useOrderDetails } from '../hooks/useOrderDetails';

export interface ActivityModalGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  role: 'user' | 'admin';
  // Optional explicit state; otherwise derived from details
  orderState?: 'active' | 'archived' | 'deleted';

  // Optional initial order data for instant rendering (performance optimization)
  initialOrderData?: any;

  // Admin callbacks
  onEdit?: (order: any) => void;
  onArchive?: (orderId: string, reason?: string) => Promise<void> | void;
  onRestore?: (orderId: string) => Promise<void> | void;
  onDelete?: (orderId: string) => Promise<void> | void;

  // User action callback
  onAction?: (orderId: string, action: string) => void;

  // For user hubs, pass backend-driven actions when available
  userAvailableActions?: string[];
}

export function ActivityModalGateway({
  isOpen,
  onClose,
  orderId,
  role,
  orderState,
  initialOrderData,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onAction,
  userAvailableActions,
}: ActivityModalGatewayProps) {
  const details = useOrderDetails({ orderId, initial: initialOrderData });

  // Shared behavior: Auto-close modal after successful action
  const handleActionWithAutoClose = React.useCallback(async (orderId: string, action: string) => {
    if (onAction) {
      await onAction(orderId, action);
      // Auto-close after any action (centralized behavior)
      onClose();
    }
  }, [onAction, onClose]);

  const derivedState: 'active' | 'archived' | 'deleted' = useMemo(() => {
    if (orderState) return orderState;
    if (details.order?.isDeleted) return 'deleted';
    if (details.archiveMetadata?.archivedAt) return 'archived';
    return 'active';
  }, [orderState, details.order, details.archiveMetadata]);

  const order = details.order
    ? {
        orderId: details.order.orderId,
        orderType: details.order.orderType,
        title: details.order.title,
        requestedBy: details.order.requestedBy,
        destination: details.order.destination,
        requestedDate: details.order.requestedDate,
        status: details.order.status,
        notes: details.order.notes,
        items: details.order.items,
        serviceId: details.order.serviceId,
        approvalStages: details.order.approvalStages,
        transformedId: details.order.serviceId || null,
        isDeleted: details.order.isDeleted,
        deletedAt: details.order.deletedAt,
        deletedBy: details.order.deletedBy,
        managedById: details.order.managedById,
        managedByName: details.order.managedByName,
        fulfilledById: details.order.fulfilledById,
        fulfilledByName: details.order.fulfilledByName,
      }
    : null;

  const actions: ActivityAction[] = useMemo(() => {
    if (!order) return [];

    if (role === 'admin') {
      const arr: ActivityAction[] = [];
      if (derivedState === 'active') {
        if (onEdit) {
          arr.push({ label: 'Edit Order', variant: 'secondary', onClick: () => onEdit(details.order) });
        }
        if (onArchive) {
          arr.push({ label: 'Archive Order', variant: 'secondary', onClick: () => onArchive(order.orderId) });
        }
      } else if (derivedState === 'archived') {
        if (onRestore) {
          arr.push({ label: 'Restore Order', variant: 'secondary', onClick: () => onRestore(order.orderId) });
        }
        if (onDelete) {
          arr.push({ label: 'Delete Order', variant: 'danger', onClick: () => onDelete(order.orderId) });
        }
      }
      return arr;
    }

    // role === 'user' : map availableActions → ActivityAction[]
    const list = (userAvailableActions || []).filter((l) => l && l.toLowerCase() !== 'view details');
    return list.map((label) => ({
      label,
      variant: /accept|approve|create service/i.test(label) ? 'primary' : /reject|decline|cancel/i.test(label) ? 'danger' : 'secondary',
      onClick: () => handleActionWithAutoClose(order.orderId, label),
    }));
  }, [order, role, derivedState, userAvailableActions, handleActionWithAutoClose, onEdit, onArchive, onRestore, onDelete, details.order]);

  return (
    <ActivityModal
      isOpen={isOpen}
      onClose={onClose}
      role={role}
      order={order}
      actions={actions}
      defaultExpanded={false}
      requestorInfo={details.requestorInfo}
      destinationInfo={details.destinationInfo}
      availability={details.availability}
      serviceDetails={details.serviceDetails}
      cancellationReason={details.cancellationInfo.cancellationReason}
      cancelledBy={details.cancellationInfo.cancelledBy}
      cancelledAt={details.cancellationInfo.cancelledAt}
      rejectionReason={details.rejectionReason}
      rejectedBy={details.rejectedBy}
      rejectedAt={details.rejectedAt}
      archiveMetadata={details.archiveMetadata}
    />
  );
}

export default ActivityModalGateway;
