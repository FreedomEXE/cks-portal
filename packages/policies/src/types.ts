// Policy Types - Central definitions for role-based permissions

export const POLICY_VERSION = '1.0.0';

export type HubRole = 'warehouse' | 'center' | 'manager' | 'contractor' | 'crew' | 'customer';

export type OrderType = 'product' | 'service';

// Product order statuses
export type ProductOrderStatus =
  | 'pending_warehouse'
  | 'awaiting_delivery'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

// Service order statuses
export type ServiceOrderStatus =
  | 'pending_manager'
  | 'pending_contractor'
  | 'pending_crew'
  | 'service_in_progress'
  | 'service_completed'
  | 'rejected'
  | 'cancelled';

export type OrderStatus = ProductOrderStatus | ServiceOrderStatus;

export type OrderAction =
  | 'accept'
  | 'reject'
  | 'deliver'
  | 'complete'
  | 'cancel'
  | 'create-service';

export interface OrderContext {
  role: HubRole;
  userId: string;
  orderType: OrderType;
  status: OrderStatus;
  participants?: OrderParticipant[];
  isCreator?: boolean;
  isAssignedActor?: boolean;
}

export interface OrderParticipant {
  userId: string;
  role: HubRole;
  participationType: 'creator' | 'actor' | 'watcher' | 'destination';
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  nextStatus?: OrderStatus;
}