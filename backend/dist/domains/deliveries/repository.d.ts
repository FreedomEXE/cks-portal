import { DeliveriesQuery, ShipmentEntity } from './types';
export declare function listShipments(warehouseId: string, query: DeliveriesQuery): Promise<ShipmentEntity[]>;
export declare function updateShipmentStatus(warehouseId: string, shipmentId: string, status: string): Promise<ShipmentEntity | null>;
//# sourceMappingURL=repository.d.ts.map