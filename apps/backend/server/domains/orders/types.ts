import type { HubRole } from '../profile/types';
import type { OrderParticipant } from '@cks/policies';

export type OrderStatus =
  // Product order statuses
  | 'pending_warehouse'
  | 'awaiting_delivery'
  | 'delivered'
  // Service order statuses
  | 'pending_customer'
  | 'pending_contractor'
  | 'pending_manager'
  | 'manager_accepted'
  | 'crew_requested'
  | 'crew_assigned'
  | 'service_created'
  // Common terminal statuses
  | 'cancelled'
  | 'rejected'
  // Legacy statuses (to be removed)
  | 'pending'
  | 'in-progress'
  | 'approved'
  | 'pending_crew'
  | 'service_in_progress'
  | 'service_completed'
  | 'service-created';

export type OrderViewerStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  // Non-workflow overlay status for UI archive tab
  | 'archived';

export interface OrderApprovalStage {
  role: string;
  status:
    | 'pending'
    | 'approved'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'delivered'
    | 'service-created'
    | 'requested'
    | 'waiting';
  userId: string | null;
  timestamp: string | null;
  label?: string | null; // Optional custom display label
}
export interface HubOrderLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  itemType: 'service' | 'product';
  quantity: number;
  unitOfMeasure: string | null;
  unitPrice: string | null;
  currency: string | null;
  totalPrice: string | null;
  metadata: Record<string, unknown> | null;
}

export interface HubOrderItem {
  orderId: string;
  orderType: 'service' | 'product';
  title: string | null;
  requestedBy: string | null;
  requesterRole: HubRole | null;
  destination: string | null;
  destinationRole: HubRole | null;
  requestedDate: string | null;
  expectedDate: string | null;
  serviceStartDate: string | null;
  deliveryDate: string | null;
  status: OrderStatus;
  viewerStatus: OrderViewerStatus;
  approvalStages: OrderApprovalStage[];
  items: HubOrderLineItem[];
  totalAmount: string | null;
  currency: string | null;
  transformedId: string | null;
  nextActorRole: HubRole | null;
  rejectionReason: string | null;
  notes: string | null;
  /** Legacy compatibility aliases for existing frontend hubs */
  id?: string | null;
  customerId?: string | null;
  centerId?: string | null;
  serviceId?: string | null;
  assignedWarehouse?: string | null;
  orderDate?: string | null;
  completionDate?: string | null;

  /** New policy-based fields */
  participants?: OrderParticipant[];
  availableActions?: string[];
  statusColor?: string;
  statusLabel?: string;
  metadata?: Record<string, unknown> | null;
  archivedAt?: string | null;
}

export interface HubOrdersPayload {
  role: HubRole;
  cksCode: string;
  serviceOrders: HubOrderItem[];
  productOrders: HubOrderItem[];
  orders: HubOrderItem[];
}



