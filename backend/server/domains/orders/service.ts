import { OrderEntity, OrdersQuery, OrderStatus } from './types';
import * as repo from './repository';

export async function list(query: OrdersQuery): Promise<OrderEntity[]> {
  const q: OrdersQuery = {
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    page: Math.max(query.page || 1, 1),
    status: query.status,
  };
  return await repo.listOrders(q);
}

export async function get(orderId: number): Promise<OrderEntity | null> {
  return await repo.getOrder(orderId);
}

export async function updateStatus(orderId: number, status: OrderStatus): Promise<OrderEntity | null> {
  return await repo.updateOrderStatus(orderId, status);
}

