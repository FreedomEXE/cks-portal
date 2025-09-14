import { DeliveriesQuery, ShipmentEntity, ShipmentStatus } from './types';
import * as repo from './repository';

export async function list(warehouseId: string, query: DeliveriesQuery): Promise<ShipmentEntity[]> {
  const q: DeliveriesQuery = {
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    page: Math.max(query.page || 1, 1),
    status: query.status,
    type: query.type,
  };
  return await repo.listShipments(warehouseId, q);
}

export async function updateStatus(warehouseId: string, shipmentId: string, status: ShipmentStatus): Promise<ShipmentEntity | null> {
  return await repo.updateShipmentStatus(warehouseId, shipmentId, status);
}

