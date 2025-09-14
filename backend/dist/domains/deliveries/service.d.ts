import { DeliveriesQuery, ShipmentEntity, ShipmentStatus } from './types';
export declare function list(warehouseId: string, query: DeliveriesQuery): Promise<ShipmentEntity[]>;
export declare function updateStatus(warehouseId: string, shipmentId: string, status: ShipmentStatus): Promise<ShipmentEntity | null>;
//# sourceMappingURL=service.d.ts.map