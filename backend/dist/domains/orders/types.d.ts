export type OrderStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
export interface OrderEntity {
    order_id: number;
    status: OrderStatus;
    customer_id?: string | null;
    contractor_id?: string | null;
    total_amount?: number | null;
    created_at?: string | Date;
    updated_at?: string | Date;
}
export interface OrdersQuery {
    status?: OrderStatus;
    limit?: number;
    page?: number;
}
export interface OrdersRouteConfig {
    capabilities: {
        view: string;
        create?: string;
        update?: string;
        approve?: string;
    };
    features: {
        listing: boolean;
        details: boolean;
        statusTracking: boolean;
        approval?: boolean;
        analytics?: boolean;
    };
    scope: 'global' | 'ecosystem' | 'entity';
    roleCode: string;
}
//# sourceMappingURL=types.d.ts.map