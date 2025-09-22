export type AdminUserStatus = 'active' | 'suspended' | 'archived';
export type AdminUserRole = 'admin';

export interface AdminUserRecord {
  id: string;
  clerkUserId: string;
  cksCode: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  fullName?: string | null;
  email?: string | null;
  territory?: string | null;
  phone?: string | null;
  address?: string | null;
  reportsTo?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
}

export interface AdminUserCreateInput {
  clerkUserId: string;
  cksCode: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  fullName?: string | null;
  email?: string | null;
  territory?: string | null;
  phone?: string | null;
  address?: string | null;
  reportsTo?: string | null;
}

export interface AdminUserUpdateInput {
  cksCode?: string;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  fullName?: string | null;
  email?: string | null;
  territory?: string | null;
  phone?: string | null;
  address?: string | null;
  reportsTo?: string | null;
  archivedAt?: string | null;
}

export interface AdminUserQueryFilter {
  status?: AdminUserStatus;
  territory?: string;
  role?: AdminUserRole;
}

export interface AdminUserQueryOptions {
  filter?: AdminUserQueryFilter;
  limit?: number;
  offset?: number;
}
