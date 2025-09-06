export declare function getNextIdGeneric(table: string, idColumn: string, prefix: string): Promise<string>;
export declare function upsertAppUserByEmail(email: string | null | undefined, role: string, code: string, name?: string): Promise<void>;
export declare function createManager(data: {
    manager_name: string;
    email?: string;
    phone?: string;
    territory?: string;
}): Promise<any>;
export declare function getManagers(limit?: number, offset?: number): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function archiveManager(manager_id: string, admin_user_id?: string): Promise<{
    manager_id: string;
    message: string;
}>;
export declare function getArchivedManagers(limit?: number, offset?: number): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function createContractor(data: {
    contractor_name: string;
    email?: string;
    phone?: string;
    service_area?: string;
}): Promise<any>;
export declare function createCustomer(data: {
    company_name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
}): Promise<any>;
//# sourceMappingURL=user-management.d.ts.map