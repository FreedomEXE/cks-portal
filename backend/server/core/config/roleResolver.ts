import { AdminConfig } from '../../roles/admin/config';
import { ManagerConfig } from '../../roles/manager/config';
import { WarehouseConfig } from '../../roles/warehouse/config';

export type RoleCode =
  | 'admin'
  | 'manager'
  | 'warehouse'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew';

export type DomainName =
  | 'dashboard'
  | 'profile'
  | 'directory'
  | 'services'
  | 'orders'
  | 'reports'
  | 'support'
  | 'assignments'
  | 'archive'
  | 'catalog'
  | 'inventory'
  | 'deliveries';

// Minimal normalized shape accepted by Fastify domain plugins in this codebase
export type DomainConfigBase = {
  capabilities?: Record<string, string> & Record<string, any>;
  features?: Record<string, any>;
  scope?: 'global' | 'ecosystem' | 'entity';
  roleCode?: RoleCode | string;
  // Allow passthrough of domain-specific fields without typing explosion
  [key: string]: any;
};

type RoleConfig = {
  role: { code: RoleCode | string; scope: DomainConfigBase['scope'] } & Record<string, any>;
  domains: Record<string, DomainConfigBase | undefined>;
};

const DOMAIN_ALIASES: Record<string, string[]> = {
  assignments: ['assign'],
};

function normalizeDomainName(name: string): string {
  const n = String(name || '').toLowerCase();
  if (!n) return n;
  for (const canonical of Object.keys(DOMAIN_ALIASES)) {
    const aliases = DOMAIN_ALIASES[canonical];
    if (n === canonical || aliases.includes(n)) return canonical;
  }
  return n;
}

export function resolveRole(roleParam: string): RoleCode | null {
  const r = String(roleParam || '').toLowerCase() as RoleCode;
  const valid: RoleCode[] = ['admin', 'manager', 'warehouse', 'contractor', 'customer', 'center', 'crew'];
  return valid.includes(r) ? r : null;
}

function getRoleConfigInternal(role: RoleCode): RoleConfig | null {
  switch (role) {
    case 'admin':
      return AdminConfig as unknown as RoleConfig;
    case 'manager':
      return ManagerConfig as unknown as RoleConfig;
    case 'warehouse':
      return WarehouseConfig as unknown as RoleConfig;
    // Roles not yet implemented in this repo
    case 'contractor':
    case 'customer':
    case 'center':
    case 'crew':
    default:
      return null;
  }
}

export function getRoleConfig(role: RoleCode): RoleConfig | null {
  return getRoleConfigInternal(role);
}

export function hasDomain(role: RoleCode, domain: DomainName | string): boolean {
  const rc = getRoleConfigInternal(role);
  if (!rc) return false;
  const dn = normalizeDomainName(domain);
  return !!rc.domains && dn in rc.domains && !!rc.domains[dn];
}

export function resolveDomainConfig(
  role: RoleCode,
  domain: DomainName | string
): DomainConfigBase | null {
  const rc = getRoleConfigInternal(role);
  if (!rc) return null;
  const dn = normalizeDomainName(domain);
  const cfg = rc.domains?.[dn];
  if (!cfg) return null;
  // Shallow clone + ensure roleCode present
  return { ...cfg, roleCode: role };
}

export function getDomainCapabilities(
  role: RoleCode,
  domain: DomainName | string
): Record<string, any> {
  const cfg = resolveDomainConfig(role, domain);
  return (cfg?.capabilities as Record<string, any>) || {};
}

export function getDomainFeatures(
  role: RoleCode,
  domain: DomainName | string
): Record<string, any> {
  const cfg = resolveDomainConfig(role, domain);
  return (cfg?.features as Record<string, any>) || {};
}

export function requireDomainConfig(
  role: RoleCode,
  domain: DomainName | string
): DomainConfigBase {
  const cfg = resolveDomainConfig(role, domain);
  if (!cfg) {
    const dn = normalizeDomainName(domain);
    throw new Error(`Domain config not found for role=${role} domain=${dn}`);
  }
  return cfg;
}

export function listDomains(role: RoleCode): string[] {
  const rc = getRoleConfigInternal(role);
  if (!rc?.domains) return [];
  return Object.keys(rc.domains).filter((k) => !!rc.domains[k]);
}

export function getRoleScope(role: RoleCode): DomainConfigBase['scope'] | undefined {
  const rc = getRoleConfigInternal(role);
  return rc?.role?.scope as any;
}
