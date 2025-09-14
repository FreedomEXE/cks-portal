export type UserRole = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew';
export declare function roleFromInternalCode(code: string): UserRole | null;
export declare function isValidCode(code: string, role: UserRole): boolean;
export declare function getPrefixForRole(role: UserRole): string;
//# sourceMappingURL=roles.d.ts.map