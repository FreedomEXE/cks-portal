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

  // Get active inventory items
  const activeItemsResult = await query<{
    product_id: string;
    product_name: string;
    category: string;
    stock_level: number;
    reorder_point: number;
    warehouse_id: string;
  }>(
    `SELECT
      product_id,
      product_name,
      COALESCE(category, 'Equipment') as category,
      COALESCE(stock_level, 0) as stock_level,
      COALESCE(reorder_point, 10) as reorder_point,
      COALESCE(warehouse_id, $1) as warehouse_id
    FROM products
    WHERE UPPER(warehouse_id) = $1
      AND (archived_at IS NULL OR status = 'active')
    ORDER BY product_name`,
    [cksCode],
  );

  // Get archived inventory items
  const archivedItemsResult = await query<{
    product_id: string;
    product_name: string;
    category: string;
    archived_at: string;
    archive_reason: string;
  }>(
    `SELECT
      product_id,
      product_name,
      COALESCE(category, 'Equipment') as category,
      archived_at,
      archive_reason
    FROM products
    WHERE UPPER(warehouse_id) = $1
      AND archived_at IS NOT NULL
      AND (status IS NULL OR status != 'active')
    ORDER BY archived_at DESC`,
    [cksCode],
  );

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

  const archivedItems: InventoryItem[] = archivedItemsResult.rows.map(row => ({
    productId: row.product_id,
    name: row.product_name,
    type: row.category,
    onHand: 0,
    min: 0,
    location: cksCode,
    isLow: false,
    status: 'archived' as const,
    archivedDate: row.archived_at,
    reason: row.archive_reason,
  }));

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