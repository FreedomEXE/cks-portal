import { ArchivedOrder } from './types';
export declare function listArchivedOrders(limit?: number, page?: number): Promise<ArchivedOrder[]>;
export declare function restoreOrder(orderId: number): Promise<boolean>;
//# sourceMappingURL=repository.d.ts.map