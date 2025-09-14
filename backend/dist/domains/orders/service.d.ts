import { OrderEntity, OrdersQuery, OrderStatus } from './types';
export declare function list(query: OrdersQuery): Promise<OrderEntity[]>;
export declare function get(orderId: number): Promise<OrderEntity | null>;
export declare function updateStatus(orderId: number, status: OrderStatus): Promise<OrderEntity | null>;
//# sourceMappingURL=service.d.ts.map