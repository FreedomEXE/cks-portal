export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';
export type ShipmentType = 'inbound' | 'outbound';
export interface ShipmentEntity {
    shipment_id: string;
    warehouse_id: string;
    shipment_type: ShipmentType;
    carrier?: string | null;
    tracking_number?: string | null;
    origin_address?: string | null;
    destination_address?: string | null;
    shipment_date?: string | Date;
    expected_delivery_date?: string | Date;
    actual_delivery_date?: string | Date;
    status: ShipmentStatus;
    total_weight?: number | null;
    total_value?: number | null;
}
export interface DeliveriesQuery {
    status?: ShipmentStatus;
    type?: ShipmentType;
    limit?: number;
    page?: number;
}
export interface DeliveriesRouteConfig {
    capabilities: {
        view: string;
        update?: string;
    };
    scope: 'entity';
    roleCode: 'warehouse';
}
//# sourceMappingURL=types.d.ts.map