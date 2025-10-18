import React from 'react';
import styles from './OrderActionModal.module.css';
import { ModalRoot } from '../ModalRoot';
import OrderCard from '../../cards/OrderCard';

export interface OrderActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string;
    requestedBy?: string | null;
    destination?: string | null;
    requestedDate: string | null;
    expectedDate?: string | null;
    serviceStartDate?: string | null;
    deliveryDate?: string | null;
    status: string;
    approvalStages?: Array<{
      role: string;
      status: string;
      user?: string | null;
      timestamp?: string | null;
    }>;
    availableActions?: string[];
    transformedId?: string | null;
  };
  onAction: (orderId: string, action: string) => void;
}

export function OrderActionModal({ isOpen, onClose, order, onAction }: OrderActionModalProps) {
  if (!isOpen || !order) return null;

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ?
          </button>
        </div>
        <OrderCard
          orderId={order.orderId}
          orderType={order.orderType}
          title={order.title}
          requestedBy={order.requestedBy ?? undefined}
          destination={order.destination ?? undefined}
          requestedDate={order.requestedDate || new Date().toISOString()}
          expectedDate={order.expectedDate || undefined}
          serviceStartDate={order.serviceStartDate || undefined}
          deliveryDate={order.deliveryDate || undefined}
          status={(order.status || 'pending') as any}
          approvalStages={(order.approvalStages as any) || []}
          actions={order.availableActions || []}
          onAction={(action) => {
            onAction(order.orderId, action);
            onClose();
          }}
          showWorkflow={true}
          collapsible={false}
          defaultExpanded={true}
          transformedId={order.transformedId || undefined}
        />
      </div>
    </ModalRoot>
  );
}
