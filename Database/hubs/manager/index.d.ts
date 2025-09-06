export declare function getManagerProfile(manager_id: string): Promise<any>;
export declare function updateManagerProfile(manager_id: string, updates: {
    manager_name?: string;
    email?: string;
    phone?: string;
    territory?: string;
}): Promise<any>;
export declare function getManagerContractors(manager_id: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
}): Promise<{
    contractors: any[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getManagerCustomers(manager_id: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
}): Promise<{
    customers: any[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getManagerCenters(manager_id: string): Promise<{
    centers: any[];
    total: number | null;
}>;
export declare function getManagerDashboardStats(manager_id: string): Promise<{
    active_contractors: number;
    active_customers: number;
    centers: number;
    recent_activity: number;
    generated_at: string;
}>;
export declare function assignContractorToCustomer(manager_id: string, contractor_id: string, customer_id: string): Promise<any>;
//# sourceMappingURL=index.d.ts.map