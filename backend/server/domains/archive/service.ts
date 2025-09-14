import * as repo from './repository';

export async function listArchivedOrders(limit?: number, page?: number) {
  return await repo.listArchivedOrders(limit, page);
}

export async function restoreOrder(orderId: number) {
  return await repo.restoreOrder(orderId);
}

