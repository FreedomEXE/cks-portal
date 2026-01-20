import { query } from '../../db/connection';
import { normalizeIdentity } from '../identity';
import type { HubInventoryPayload, InventoryItem } from './types';
import { recordActivity } from '../activity/writer';

async function getWarehouseInventory(cksCode: string): Promise<HubInventoryPayload | null> {
  const warehouseResult = await query<{ status: string | null }>(
    `SELECT status FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [cksCode],
  );

  if (!warehouseResult.rowCount) {
    return null;
  }

  const isTest = cksCode.toUpperCase().includes('-TEST');

  // Get active inventory items from catalog (with warehouse inventory overlay)
  const activeItemsResult = await query<{
    product_id: string;
    product_name: string;
    category: string;
    stock_level: number;
    reorder_point: number;
    warehouse_id: string;
  }>(
    `SELECT
      p.product_id as product_id,
      COALESCE(ii.item_name, p.name) as product_name,
      COALESCE(p.category, ii.category, 'Cleaning Supplies') as category,
      COALESCE(ii.quantity_on_hand, 0) as stock_level,
      COALESCE(ii.min_stock_level, p.reorder_point, 10) as reorder_point,
      $1 as warehouse_id
    FROM catalog_products p
    LEFT JOIN inventory_items ii
      ON ii.item_id = p.product_id
      AND UPPER(ii.warehouse_id) = $1
      AND ii.status = 'active'
    WHERE p.is_active = TRUE
      AND ${isTest ? 'p.product_id ILIKE $2' : 'p.product_id NOT ILIKE $2'}
    ORDER BY COALESCE(ii.item_name, p.name)`,
    [cksCode, '%-TEST%'],
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
  actorId: string;
  actorRole: string;
}

export async function updateInventoryQuantity(input: UpdateInventoryInput): Promise<void> {
  const { warehouseId, itemId, quantityChange, reason, actorId, actorRole } = input;
  const normalizedWarehouseId = warehouseId.toUpperCase();
  const normalizedItemId = itemId.toUpperCase();

  // Validate warehouse exists
  const warehouseCheck = await query(
    `SELECT warehouse_id FROM warehouses WHERE UPPER(warehouse_id) = $1 LIMIT 1`,
    [normalizedWarehouseId]
  );

  if (warehouseCheck.rowCount === 0) {
    throw new Error(`Warehouse ${warehouseId} not found`);
  }

  // Check if inventory item exists
  const itemCheck = await query(
    `SELECT quantity_on_hand FROM inventory_items WHERE UPPER(warehouse_id) = $1 AND UPPER(item_id) = $2`,
    [normalizedWarehouseId, normalizedItemId]
  );

  if (itemCheck.rowCount === 0) {
    if (quantityChange < 0) {
      throw new Error(`Cannot reduce inventory below 0. Current: 0, Change: ${quantityChange}`);
    }

    const catalogCheck = await query<{
      product_id: string;
      name: string;
      category: string | null;
      reorder_point: number | null;
    }>(
      `SELECT product_id, name, category, reorder_point
       FROM catalog_products
       WHERE UPPER(product_id) = $1
       LIMIT 1`,
      [normalizedItemId]
    );

    if (catalogCheck.rowCount === 0) {
      throw new Error(`Item ${itemId} not found in catalog`);
    }

    const catalogItem = catalogCheck.rows[0];
    const newQty = quantityChange;
    const minStockLevel = catalogItem.reorder_point ?? 10;

    await query(
      `INSERT INTO inventory_items
       (warehouse_id, item_id, item_name, category, quantity_on_hand, min_stock_level, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())`,
      [
        normalizedWarehouseId,
        catalogItem.product_id,
        catalogItem.name,
        catalogItem.category,
        newQty,
        minStockLevel,
      ]
    );

    try {
      await recordActivity({
        activityType: 'product_inventory_adjusted',
        description: `Adjusted ${normalizedItemId} inventory`,
        actorId,
        actorRole,
        targetId: normalizedItemId,
        targetType: 'product',
        metadata: {
          warehouseId: normalizedWarehouseId,
          quantityChange,
          newQuantity: newQty,
          reason: reason || null,
        },
      });
    } catch (e) {
      console.warn('[inventory] Failed to record product_inventory_adjusted activity', e);
    }
    return;
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
    [newQty, normalizedWarehouseId, normalizedItemId]
  );

  // Log the inventory adjustment (optional - if you have an audit table)
  // await query(
  //   `INSERT INTO inventory_adjustments (warehouse_id, item_id, quantity_change, reason, adjusted_at)
  //    VALUES ($1, $2, $3, $4, NOW())`,
  //   [warehouseId, itemId, quantityChange, reason || 'Manual adjustment']
  // );

  // Record activity for product inventory adjustment (admin/warehouse visibility)
  try {
    await recordActivity({
      activityType: 'product_inventory_adjusted',
      description: `Adjusted ${itemId.toUpperCase()} inventory`,
      actorId,
      actorRole,
      targetId: normalizedItemId,
      targetType: 'product',
      metadata: {
        warehouseId: normalizedWarehouseId,
        quantityChange,
        newQuantity: newQty,
        reason: reason || null,
      },
    });
  } catch (e) {
    // Non-blocking
    console.warn('[inventory] Failed to record product_inventory_adjusted activity', e);
  }
}
