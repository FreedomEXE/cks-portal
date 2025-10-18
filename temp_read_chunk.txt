import React from 'react';
import { ProductOrderModal, ServiceOrderModal } from '@cks/ui';
import { useOrderDetails } from '../hooks/useOrderDetails';

interface Props {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailsGateway({ orderId, onClose }: Props) {
  const orderDetails = useOrderDetails({ orderId });

  if (!orderId || !orderDetails.order) return null;

  const isService = orderDetails.order.orderType === 'service';
  const commonProps = {
    isOpen: true,
    onClose,
    order: orderDetails.order,
    availability: orderDetails.availability,
    cancellationReason: orderDetails.cancellationInfo.cancellationReason,
    cancelledBy: orderDetails.cancellationInfo.cancelledBy,
    cancelledAt: orderDetails.cancellationInfo.cancelledAt,
    rejectionReason: orderDetails.rejectionReason,
    requestorInfo: orderDetails.requestorInfo,
    destinationInfo: orderDetails.destinationInfo,
    rejectedBy: orderDetails.rejectedBy,
    rejectedAt: orderDetails.rejectedAt,
    archiveMetadata: orderDetails.archiveMetadata,
  } as const;

  return isService ? (
    <ServiceOrderModal {...commonProps} />
  ) : (
    <ProductOrderModal {...commonProps} />
  );
}

export default OrderDetailsGateway;


