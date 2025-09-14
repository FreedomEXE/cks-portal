import pool from '../../db/connection';
import { DeliveriesQuery, ShipmentEntity } from './types';

export async function listShipments(warehouseId: string, query: DeliveriesQuery): Promise<ShipmentEntity[]> {
  const where: string[] = ['warehouse_id = $1'];
  const vals: any[] = [warehouseId];
  if (query.status) { vals.push(query.status); where.push(`status = $${vals.length}`); }
  if (query.type) { vals.push(query.type); where.push(`shipment_type = $${vals.length}`); }
  const lim = Math.min(Math.max(query.limit || 25, 1), 200);
  const off = Math.max(((query.page || 1) - 1) * lim, 0);
  const res = await pool.query(
    `SELECT shipment_id, warehouse_id, shipment_type, carrier, tracking_number, origin_address, destination_address,
            shipment_date, expected_delivery_date, actual_delivery_date, status, total_weight, total_value
     FROM warehouse_shipments
     WHERE ${where.join(' AND ')}
     ORDER BY shipment_date DESC NULLS LAST, shipment_id DESC
     LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
    [...vals, lim, off]
  );
  return res.rows as ShipmentEntity[];
}

export async function updateShipmentStatus(warehouseId: string, shipmentId: string, status: string): Promise<ShipmentEntity | null> {
  const res = await pool.query(
    `UPDATE warehouse_shipments SET status = $3, updated_at = NOW()
     WHERE warehouse_id = $1 AND shipment_id = $2
     RETURNING shipment_id, warehouse_id, shipment_type, carrier, tracking_number, origin_address, destination_address,
               shipment_date, expected_delivery_date, actual_delivery_date, status, total_weight, total_value`,
    [warehouseId, shipmentId, status]
  );
  return (res.rows?.[0] as ShipmentEntity) || null;
}

