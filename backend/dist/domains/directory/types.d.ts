export type DirectoryEntityType = 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'manager';
export interface DirectoryQuery {
    type?: DirectoryEntityType;
    q?: string;
    status?: 'active' | 'inactive' | 'archived' | 'pending';
    page?: number;
    limit?: number;
}
export interface DirectoryItemBase {
    id: string;
    type: DirectoryEntityType;
    name: string;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
    created_at?: string | Date;
}
export interface DirectoryRouteConfig {
    capabilities: {
        view: string;
        create?: string;
        update?: string;
        delete?: string;
        admin?: string;
    };
    features: {
        contractors?: boolean;
        customers?: boolean;
        centers?: boolean;
        crew?: boolean;
        warehouses?: boolean;
        managers?: boolean;
        search?: boolean;
        filters?: boolean;
        export?: boolean;
    };
    scope: 'global' | 'ecosystem';
    roleCode: string;
}
//# sourceMappingURL=types.d.ts.map