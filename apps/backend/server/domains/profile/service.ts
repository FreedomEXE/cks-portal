export { getHubProfile } from './store';
import { getEntityWithFallback } from '../entities/service';
import { clerkClient } from '../../core/clerk/client';
import { normalizeIdentity } from '../identity';

type EntityState = 'active' | 'archived' | 'deleted';

export interface UserDetailsResult {
  data: any;
  state: EntityState;
  source: 'live' | 'tombstone';
  deletedAt?: string;
  deletedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
}

/**
 * Fetch user entity details in directory-normalized format.
 * Works for active, archived, and deleted users.
 */
export async function getUserDetails(
  entityType: string,
  entityId: string
): Promise<UserDetailsResult> {
  // Fetch with fallback (active → archived → tombstone)
  const result = await getEntityWithFallback(entityType, entityId, true);

  // Normalize to directory format
  const normalized = normalizeUserEntity(entityType, result.entity);
  const photoUrl = await resolveProfilePhotoUrl(result.entity as Record<string, unknown>, entityId);
  if (photoUrl) {
    normalized.photoUrl = photoUrl;
    normalized.imageUrl = photoUrl;
  }

  return {
    data: normalized,
    state: result.state,
    source: result.state === 'deleted' ? 'tombstone' : 'live',
    deletedAt: result.deletedAt,
    deletedBy: result.deletedBy,
    archivedAt: result.archivedAt,
    archivedBy: result.archivedBy,
  };
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

async function resolveProfilePhotoUrl(
  entityRow: Record<string, unknown>,
  entityId: string,
): Promise<string | null> {
  const clerkUserId = toNullableString(entityRow.clerk_user_id ?? entityRow.clerkUserId);

  try {
    if (clerkUserId) {
      const user = await clerkClient.users.getUser(clerkUserId);
      const directUrl = toNullableString((user as any)?.imageUrl ?? (user as any)?.profileImageUrl);
      if (directUrl) {
        return directUrl;
      }
    }
  } catch (error) {
    console.warn('[profile] Clerk lookup by user ID failed', { clerkUserId, error });
  }

  try {
    const normalizedId = normalizeIdentity(entityId) ?? entityId.trim();
    if (!normalizedId) {
      return null;
    }

    const listResult = await (clerkClient.users as any).getUserList?.({ externalId: [normalizedId] });
    const users = Array.isArray(listResult) ? listResult : listResult?.data;
    const firstMatch = Array.isArray(users) ? users[0] : null;
    return toNullableString(firstMatch?.imageUrl ?? firstMatch?.profileImageUrl);
  } catch (error) {
    console.warn('[profile] Clerk lookup by externalId failed', { entityId, error });
    return null;
  }
}

/**
 * Normalize database row to directory format based on entity type.
 * Replicates the normalization logic from directory/store.ts for each user type.
 */
function normalizeUserEntity(entityType: string, row: any): any {
  const toNullableString = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    return str === '' ? null : str;
  };

  const toNullableNumber = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  };

  const toIso = (date: Date | string | null | undefined): string | null => {
    if (!date) return null;
    const value = typeof date === 'string' ? new Date(date) : date;
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  };

  const formatPrefixedId = (value: string | null | undefined, fallbackPrefix?: string): string => {
    if (!value) {
      return fallbackPrefix ? `${fallbackPrefix}-???` : 'N/A';
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return fallbackPrefix ? `${fallbackPrefix}-???` : 'N/A';
    }
    const match = trimmed.match(/^([A-Za-z]+)-?(\d+)$/);
    if (match) {
      const prefix = (fallbackPrefix ?? match[1]).toUpperCase();
      const digits = match[2].padStart(3, '0');
      return `${prefix}-${digits}`;
    }
    return trimmed;
  };

  switch (entityType) {
    case 'manager':
      return {
        id: formatPrefixedId(row.manager_id, 'MGR'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        name: row.name ?? row.manager_id,
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        territory: toNullableString(row.territory),
        role: toNullableString(row.role),
        reportsTo: toNullableString(row.reports_to),
        address: toNullableString(row.address),
        status: toNullableString(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    case 'contractor':
      return {
        id: formatPrefixedId(row.contractor_id, 'CON'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        managerId: toNullableString(row.cks_manager),
        name: row.name ?? '',
        mainContact: toNullableString(row.contact_person),
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        address: toNullableString(row.address),
        status: toNullableString(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    case 'customer':
      return {
        id: formatPrefixedId(row.customer_id, 'CUS'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        name: toNullableString(row.name),
        managerId: toNullableString(row.cks_manager),
        mainContact: toNullableString(row.main_contact),
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        address: toNullableString(row.address),
        status: toNullableString(row.status),
        totalCenters: toNullableNumber(row.num_centers),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    case 'center':
      return {
        id: formatPrefixedId(row.center_id, 'CEN'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        name: toNullableString(row.name),
        mainContact: toNullableString(row.main_contact),
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        address: toNullableString(row.address),
        customerId: toNullableString(row.customer_id),
        contractorId: toNullableString(row.contractor_id),
        managerId: toNullableString(row.cks_manager),
        status: toNullableString(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    case 'crew':
      return {
        id: formatPrefixedId(row.crew_id, 'CRW'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        name: toNullableString(row.name),
        emergencyContact: toNullableString(row.emergency_contact),
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        address: toNullableString(row.address),
        assignedCenter: toNullableString(row.assigned_center),
        territory: toNullableString(row.territory),
        status: toNullableString(row.status),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    case 'warehouse':
      return {
        id: formatPrefixedId(row.warehouse_id, 'WHS'),
        clerkUserId: toNullableString(row.clerk_user_id ?? row.clerkUserId),
        name: toNullableString(row.name),
        managerId: toNullableString(row.manager_id),
        managerName: toNullableString(row.manager),
        mainContact: toNullableString(row.main_contact),
        warehouseType: toNullableString(row.warehouse_type),
        address: toNullableString(row.address),
        email: toNullableString(row.email),
        phone: toNullableString(row.phone),
        capacity: toNullableNumber(row.capacity),
        utilization: toNullableNumber(row.current_utilization),
        status: toNullableString(row.status),
        dateAcquired: toIso(row.date_acquired),
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
        archivedAt: toIso(row.archived_at),
      };

    default:
      throw new Error(`Unsupported entity type: ${entityType}`);
  }
}
