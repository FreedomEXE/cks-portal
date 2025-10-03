import type { HubRole } from '../profile/types';
import type { HubOrderItem, HubOrdersPayload } from './types';
import {
  applyOrderAction as storeApplyOrderAction,
  createOrder as storeCreateOrder,
  getHubOrders as storeGetHubOrders,
  fetchOrderById as storeFetchOrderById,
  archiveOrder as storeArchiveOrder,
  restoreOrder as storeRestoreOrder,
  hardDeleteOrder as storeHardDeleteOrder,
  requestCrewAssignment as storeRequestCrewAssignment,
  respondToCrewRequest as storeRespondToCrewRequest,
  type CreateOrderInput,
  type OrderActionInput,
  type OrderActionType,
} from './store';

const PRODUCT_ORDER_CREATORS = new Set<HubRole>(['manager', 'contractor', 'customer', 'center', 'crew']);
const SERVICE_ORDER_CREATORS = new Set<HubRole>(['contractor', 'customer', 'center']);

const ROLE_ACTIONS: Record<HubRole, readonly OrderActionType[]> = {
  admin: [], // Admin doesn't interact with orders directly via this endpoint
  manager: ['accept', 'reject', 'create-service', 'cancel'],
  contractor: ['accept', 'reject', 'cancel'],
  customer: ['accept', 'reject', 'cancel'],
  center: ['cancel'],
  crew: ['accept', 'reject', 'cancel'],
  warehouse: ['accept', 'reject', 'start-delivery', 'deliver', 'cancel'],
};

export type { CreateOrderInput, OrderActionInput, OrderActionType };

export async function getHubOrders(role: HubRole, cksCode: string): Promise<HubOrdersPayload | null> {
  return storeGetHubOrders(role, cksCode);
}

export async function createOrder(input: CreateOrderInput): Promise<HubOrderItem> {
  const role = input.creator.role;
  if (input.orderType === 'product' && !PRODUCT_ORDER_CREATORS.has(role)) {
    throw new Error('This role cannot create product orders.');
  }
  if (input.orderType === 'service') {
    if (!SERVICE_ORDER_CREATORS.has(role)) {
      throw new Error('This role cannot create service orders.');
    }
  }
  if (role === 'warehouse') {
    throw new Error('Warehouses may not initiate orders.');
  }
  return storeCreateOrder(input);
}

export async function applyOrderAction(input: OrderActionInput): Promise<HubOrderItem | null> {
  const allowed = ROLE_ACTIONS[input.actorRole];
  if (!allowed || !allowed.includes(input.action)) {
    throw new Error('This role cannot perform the requested order action.');
  }
  return storeApplyOrderAction(input);
}

export async function getOrderById(orderId: string): Promise<HubOrderItem | null> {
  return storeFetchOrderById(orderId, {});
}

export async function archiveOrder(orderId: string): Promise<HubOrderItem | null> {
  return storeArchiveOrder(orderId);
}

export async function restoreOrder(orderId: string): Promise<HubOrderItem | null> {
  return storeRestoreOrder(orderId);
}

export async function hardDeleteOrder(orderId: string): Promise<{ success: boolean }> {
  return storeHardDeleteOrder(orderId);
}

export async function requestCrewAssignment(
  orderId: string,
  managerCode: string,
  crewCodes: string[],
  message?: string
): Promise<HubOrderItem | null> {
  return storeRequestCrewAssignment(orderId, managerCode, crewCodes, message);
}

export async function respondToCrewRequest(
  orderId: string,
  crewCode: string,
  accept: boolean
): Promise<HubOrderItem | null> {
  return storeRespondToCrewRequest(orderId, crewCode, accept);
}
