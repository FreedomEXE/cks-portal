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

export interface UpdateInventoryInput {
  warehouseId: string;
  itemId: string;
  quantityChange: number; // Positive to add, negative to reduce
  reason?: string;
}

export async function updateInventoryQuantity(input: UpdateInventoryInput): Promise<void> {
  const { warehouseId, itemId, quantityChange, reason } = input;

  // Validate warehouse exists
  const warehouseCheck = await query(
    `SELECT warehouse_id FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [warehouseId.toUpperCase()]
  );

  if (warehouseCheck.rowCount === 0) {
    throw new Error(`Warehouse ${warehouseId} not found`);
  }

  // Check if inventory item exists
  const itemCheck = await query(
    `SELECT quantity_on_hand FROM inventory_items WHERE UPPER(warehouse_id) = $1 AND UPPER(item_id) = $2`,
    [warehouseId.toUpperCase(), itemId.toUpperCase()]
  );

  if (itemCheck.rowCount === 0) {
    throw new Error(`Item ${itemId} not found in warehouse ${warehouseId}`);
  }

  const currentQty = Number(itemCheck.rows[0].quantity_on_hand || 0);
  const newQty = currentQty + quantityChange;

  if (newQty < 0) {
    throw new Error(`Cannot reduce inventory below 0. Current: ${currentQty}, Change: ${quantityChange}`);
  }

  // Update inventory
  await query(
    `UPDATE inventory_items
     SET quantity_on_hand = $1,
         updated_at = NOW()
     WHERE UPPER(warehouse_id) = $2 AND UPPER(item_id) = $3`,
    [newQty, warehouseId.toUpperCase(), itemId.toUpperCase()]
  );

  // Log the inventory adjustment (optional - if you have an audit table)
  // await query(
  //   `INSERT INTO inventory_adjustments (warehouse_id, item_id, quantity_change, reason, adjusted_at)
  //    VALUES ($1, $2, $3, $4, NOW())`,
  //   [warehouseId, itemId, quantityChange, reason || 'Manual adjustment']
  // );
}