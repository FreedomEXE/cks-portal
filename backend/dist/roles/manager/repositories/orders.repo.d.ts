export interface Order {
    order_id: number;
    order_number: string;
    customer_id: string;
    center_id: string;
    contractor_id: string;
    service_id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    estimated_hours: number;
    actual_hours: number;
    scheduled_date: string;
    completed_date: string;
    total_amount: number;
    notes: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface OrderFilters {
    status?: string;
    priority?: string;
    customer_id?: string;
    center_id?: string;
    contractor_id?: string;
    date_from?: string;
    date_to?: string;
}
export declare function getOrdersForManager(managerId: string, filters?: OrderFilters): Promise<Order[]>;
export declare function getOrderById(orderId: number, managerId: string): Promise<Order | null>;
export declare function getOrderCountsByStatus(managerId: string): Promise<Record<string, number>>;
export declare function createOrder(orderData: Partial<Order>, managerId: string): Promise<Order>;
export declare function updateOrder(orderId: number, updates: Partial<Order>, managerId: string): Promise<Order | null>;
//# sourceMappingURL=orders.repo.d.ts.map