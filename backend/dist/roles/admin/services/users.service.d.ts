import { Pool } from 'pg';
export declare class AdminUserService {
    private pool;
    constructor(pool: Pool);
    createUser(userData: any, adminId: string): Promise<any>;
    validateUserData(userData: any): Promise<boolean>;
    resetUserPassword(userId: string, newPassword: string, adminId: string): Promise<any>;
    deactivateUser(userId: string, adminId: string): Promise<any>;
    getUsersByOrganization(orgId: string): Promise<any[]>;
    getUserActivity(userId: string, days?: number): Promise<any[]>;
}
//# sourceMappingURL=users.service.d.ts.map