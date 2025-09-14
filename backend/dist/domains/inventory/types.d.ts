export interface InventoryQuery {
    category?: string;
    status?: 'active' | 'inactive';
    q?: string;
    page?: number;
    limit?: number;
}
export interface InventoryItem {
    warehouse_id: string;
    item_id: string;
    item_type: 'product' | 'supply';
    sku?: string | null;
    item_name?: string | null;
    category?: string | null;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    min_stock_level?: number | null;
    unit_cost?: number | null;
    location_code?: string | null;
    status?: 'active' | 'inactive';
    last_received_date?: string | Date;
    last_shipped_date?: string | Date;
    created_at?: string | Date;
    updated_at?: string | Date;
}
export interface InventoryRouteConfig {
    capabilities: {
        view: string;
        adjust?: string;
    };
    scope: 'entity';
    roleCode: 'warehouse';
}
//# sourceMappingURL=types.d.ts.map