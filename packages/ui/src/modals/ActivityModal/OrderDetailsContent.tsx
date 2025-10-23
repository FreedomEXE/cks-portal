import React from 'react';
import ProductOrderContent from '../ProductOrderModal/ProductOrderContent';
import ServiceOrderContent from '../ServiceOrderModal/ServiceOrderContent';
import styles from './ActivityModal.module.css';

export interface ContactInfo {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface AvailabilityWindow {
  tz: string | null;
  days: string[];
  window: { start: string; end: string } | null;
}

export interface ArchiveMetadata {
  archivedBy: string | null;
  archivedAt: string | null;
  reason: string | null;
  scheduledDeletion: string | null;
}

export interface OrderDetailsContentProps {
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    requestedDate: string | null;
    expectedDate?: string | null;
    serviceStartDate?: string | null;
    deliveryDate?: string | null;
    status: string | null;
    notes?: string | null;
    approvalStages?: Array<{
      role: string;
      status: string;
      user?: string | null;
      timestamp?: string | null;
    }>;
    transformedId?: string | null;
    isDeleted?: boolean;
  };
  requestorInfo?: ContactInfo | null;
  destinationInfo?: ContactInfo | null;
  availability?: AvailabilityWindow | null;
  serviceDetails?: {
    serviceId: string;
    serviceName: string | null;
    serviceType: string | null;
    description: string | null;
    status: string | null;
  } | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  archiveMetadata?: ArchiveMetadata | null;
}

/**
 * OrderDetailsContent - Pure content component for order details tab
 *
 * Extracted from ActivityModal to support universal tab composition.
 * No tab management logic - just renders order details.
 */
export default function OrderDetailsContent({
  order,
  requestorInfo,
  destinationInfo,
  availability,
  serviceDetails,
  cancellationReason,
  cancelledBy,
  cancelledAt,
  rejectionReason,
  rejectedBy,
  rejectedAt,
  archiveMetadata,
}: OrderDetailsContentProps) {
  const isService = order.orderType === 'service';

  return (
    <div className={styles.detailsTab}>
      {isService ? (
        <ServiceOrderContent
          order={order as any}
          requestorInfo={requestorInfo}
          destinationInfo={destinationInfo}
          availability={availability as any}
          serviceDetails={serviceDetails}
          cancellationReason={cancellationReason}
          cancelledBy={cancelledBy}
          cancelledAt={cancelledAt}
          rejectionReason={rejectionReason}
          rejectedBy={rejectedBy}
          rejectedAt={rejectedAt}
          archiveMetadata={archiveMetadata as any}
        />
      ) : (
        <ProductOrderContent
          order={order as any}
          requestorInfo={requestorInfo}
          destinationInfo={destinationInfo}
          availability={availability as any}
          cancellationReason={cancellationReason}
          cancelledBy={cancelledBy}
          cancelledAt={cancelledAt}
          rejectionReason={rejectionReason}
          rejectedBy={rejectedBy}
          rejectedAt={rejectedAt}
          archiveMetadata={archiveMetadata as any}
        />
      )}
    </div>
  );
}
