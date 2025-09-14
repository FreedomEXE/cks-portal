import pool from '../../db/connection';
import { InventoryItem, InventoryQuery } from './types';

export async function listInventory(warehouseId: string, q: InventoryQuery): Promise<InventoryItem[]> {
  const where: string[] = ['warehouse_id = $1'];
  const vals: any[] = [warehouseId];
  if (q.category) { vals.push(q.category); where.push(`category = $${vals.length}`); }
  if (q.status) { vals.push(q.status); where.push(`status = $${vals.length}`); }
  if (q.q) { vals.push(`%${q.q}%`); where.push(`(item_name ILIKE $${vals.length} OR sku ILIKE $${vals.length})`); }
  const lim = Math.min(Math.max(q.limit || 25, 1), 200);
  const off = Math.max(((q.page || 1) - 1) * lim, 0);
  const res = await pool.query(
    `SELECT warehouse_id, item_id, item_type, sku, item_name, category,
            quantity_on_hand, quantity_reserved, quantity_available,
            min_stock_level, unit_cost, location_code, status,
            last_received_date, last_shipped_date, created_at, updated_at
     FROM inventory_items
     WHERE ${where.join(' AND ')}
     ORDER BY item_name NULLS LAST, item_id
     LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, lim, off]
  );
  return res.rows as InventoryItem[];
}

export async function adjustQuantity(warehouseId: string, itemId: string, delta: number): Promise<InventoryItem | null> {
  const field = delta >= 0 ? 'last_received_date' : 'last_shipped_date';
  const res = await pool.query(
    `UPDATE inventory_items
     SET quantity_on_hand = GREATEST(quantity_on_hand + $3, 0),
         ${field} = NOW(),
         updated_at = NOW()
     WHERE warehouse_id = $1 AND item_id = $2
     RETURNING warehouse_id, item_id, item_type, sku, item_name, category,
               quantity_on_hand, quantity_reserved, quantity_available,
               min_stock_level, unit_cost, location_code, status,
               last_received_date, last_shipped_date, created_at, updated_at`,
    [warehouseId, itemId, delta]
  );
  return (res.rows?.[0] as InventoryItem) || null;
}

