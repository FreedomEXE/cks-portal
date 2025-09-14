import { OrderEntity, OrdersQuery, OrderStatus } from './types';
export declare function listOrders(query: OrdersQuery): Promise<OrderEntity[]>;
export declare function getOrder(orderId: number): Promise<OrderEntity | null>;
export declare function updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderEntity | null>;
//# sourceMappingURL=repository.d.ts.map