import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubInventoryPayload, InventoryItem } from './types';

async function getWarehouseInventory(cksCode: string): Promise<HubInventoryPayload | null> {
  const warehouseResult = await query<{ status: string | null }>(
    `SELECT status FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [cksCode],
  );

  if (!warehouseResult.rowCount) {
    return null;
  }

  // Get active inventory items from inventory_items table
  const activeItemsResult = await query<{
    product_id: string;
    product_name: string;
    category: string;
    stock_level: number;
    reorder_point: number;
    warehouse_id: string;
  }>(
    `SELECT
      item_id as product_id,
      item_name as product_name,
      COALESCE(category, 'Cleaning Supplies') as category,
      COALESCE(quantity_on_hand, 0) as stock_level,
      COALESCE(min_stock_level, 10) as reorder_point,
      warehouse_id
    FROM inventory_items
    WHERE UPPER(warehouse_id) = $1
      AND status = 'active'
    ORDER BY item_name`,
    [cksCode],
  );

  // Get archived inventory items - currently not supported in inventory_items table
  // Return empty array for now
  const archivedItemsResult = { rows: [] as any[] };

  const activeItems: InventoryItem[] = activeItemsResult.rows.map(row => ({
    productId: row.product_id,
    name: row.product_name,
    type: row.category,
    onHand: row.stock_level,
    min: row.reorder_point,
    location: row.warehouse_id,
    isLow: row.stock_level < row.reorder_point,
    status: 'active' as const,
  }));

  const archivedItems: InventoryItem[] = [];

  return {
    role: 'warehouse',
    cksCode,
    activeItems,
    archivedItems,
  };
}

export async function getHubInventory(role: string, cksCode: string): Promise<HubInventoryPayload | null> {
  const normalizedCode = normalizeIdentity(cksCode);
  if (!normalizedCode) {
    return null;
  }

  // Currently only warehouse role has inventory
  if (role !== 'warehouse') {
    return {
      role,
      cksCode,
      activeItems: [],
      archivedItems: [],
    };
  }

  return getWarehouseInventory(normalizedCode);
}