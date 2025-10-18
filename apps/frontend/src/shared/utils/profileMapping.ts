/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: profileMapping.ts
 *
 * Description:
 * Normalizes directory user rows into the shape expected by
 * ProfileTab for each role. This keeps User modals/pages consistent
 * regardless of where the data comes from (directory list, activity, hub profile).
 */

export type DirectoryRole =
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse';

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0);
}

function fmtDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatReportsTo(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === trimmed.toUpperCase()) return trimmed; // already like CEO
  return trimmed
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Map a directory row to ProfileTab shape for the given role.
 */
export function mapProfileDataForRole(role: DirectoryRole, raw: Record<string, any> = {}) {
  // Handle each role’s expected ProfileTab fields
  switch (role) {
    case 'manager':
      return {
        fullName: isBlank(raw.fullName) ? raw.name ?? null : raw.fullName,
        managerId: raw.managerId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        territory: raw.territory ?? (raw.metadata?.territory as string | undefined) ?? null,
        role: raw.role ?? 'Manager',
        reportsTo: formatReportsTo(raw.reportsTo ?? (raw.metadata?.reportsTo as string | undefined) ?? null),
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    case 'contractor':
      return {
        name: raw.name ?? null,
        contractorId: raw.contractorId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        website: raw.website ?? (raw.metadata?.website as string | undefined) ?? null,
        mainContact: raw.mainContact ?? raw.managerName ?? null,
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    case 'customer':
      return {
        name: raw.name ?? null,
        customerId: raw.customerId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        website: raw.website ?? (raw.metadata?.website as string | undefined) ?? null,
        mainContact: raw.mainContact ?? null,
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    case 'center':
      return {
        name: raw.name ?? null,
        centerId: raw.centerId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        website: raw.website ?? (raw.metadata?.website as string | undefined) ?? null,
        mainContact: raw.mainContact ?? null,
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    case 'crew':
      return {
        name: raw.name ?? null,
        crewId: raw.crewId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        emergencyContact: raw.emergencyContact ?? null,
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    case 'warehouse':
      return {
        name: raw.name ?? null,
        warehouseId: raw.warehouseId ?? raw.id ?? null,
        address: raw.address ?? null,
        phone: raw.phone ?? null,
        email: raw.email ?? null,
        mainContact: raw.mainContact ?? null,
        startDate: fmtDate(raw.startDate ?? raw.createdAt ?? null),
      };
    default:
      return raw;
  }
}

export function directoryTabToRole(tab: string): DirectoryRole {
  const normalized = tab.toLowerCase();
  const map: Record<string, DirectoryRole> = {
    managers: 'manager',
    contractors: 'contractor',
    customers: 'customer',
    centers: 'center',
    crew: 'crew',
    warehouses: 'warehouse',
  };
  return map[normalized] ?? (normalized as DirectoryRole);
}
