import { InventoryItem, InventoryQuery } from './types';
import * as repo from './repository';

export async function list(warehouseId: string, query: InventoryQuery): Promise<InventoryItem[]> {
  const q: InventoryQuery = {
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    page: Math.max(query.page || 1, 1),
    category: query.category,
    status: query.status,
    q: query.q,
  };
  return await repo.listInventory(warehouseId, q);
}

export async function adjust(warehouseId: string, itemId: string, delta: number): Promise<InventoryItem | null> {
  return await repo.adjustQuantity(warehouseId, itemId, delta);
}

