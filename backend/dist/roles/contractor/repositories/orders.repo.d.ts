export declare function getOrdersForContractor(contractorId: string, filters?: any): Promise<any[]>;
export declare function getOrderById(contractorId: string, orderId: string): Promise<any>;
export declare function updateOrder(contractorId: string, orderId: string, updateData: any): Promise<any>;
export declare function getOrderCountsByStatus(contractorId: string): Promise<Record<string, number>>;
export declare function getAvailableJobs(contractorId: string, filters?: any): Promise<any[]>;
//# sourceMappingURL=orders.repo.d.ts.map