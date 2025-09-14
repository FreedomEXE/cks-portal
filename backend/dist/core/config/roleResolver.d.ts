export type RoleCode = 'admin' | 'manager' | 'warehouse' | 'contractor' | 'customer' | 'center' | 'crew';
export type DomainName = 'dashboard' | 'profile' | 'directory' | 'services' | 'orders' | 'reports' | 'support' | 'assignments' | 'archive' | 'catalog' | 'inventory' | 'deliveries';
export type DomainConfigBase = {
    capabilities?: Record<string, string> & Record<string, any>;
    features?: Record<string, any>;
    scope?: 'global' | 'ecosystem' | 'entity';
    roleCode?: RoleCode | string;
    [key: string]: any;
};
type RoleConfig = {
    role: {
        code: RoleCode | string;
        scope: DomainConfigBase['scope'];
    } & Record<string, any>;
    domains: Record<string, DomainConfigBase | undefined>;
};
export declare function resolveRole(roleParam: string): RoleCode | null;
export declare function getRoleConfig(role: RoleCode): RoleConfig | null;
export declare function hasDomain(role: RoleCode, domain: DomainName | string): boolean;
export declare function resolveDomainConfig(role: RoleCode, domain: DomainName | string): DomainConfigBase | null;
export declare function getDomainCapabilities(role: RoleCode, domain: DomainName | string): Record<string, any>;
export declare function getDomainFeatures(role: RoleCode, domain: DomainName | string): Record<string, any>;
export declare function requireDomainConfig(role: RoleCode, domain: DomainName | string): DomainConfigBase;
export declare function listDomains(role: RoleCode): string[];
export declare function getRoleScope(role: RoleCode): DomainConfigBase['scope'] | undefined;
export {};
//# sourceMappingURL=roleResolver.d.ts.map