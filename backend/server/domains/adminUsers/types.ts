export type AdminUserStatus = "active" | "suspended";

export interface AdminUserRecord {
  id: string;
  clerkUserId: string;
  email?: string;
  username?: string;
  cksCode: string;
  role: "admin";
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCreateInput {
  clerkUserId: string;
  email?: string;
  username?: string;
  cksCode: string;
}

export interface AdminUserUpdateInput {
  email?: string;
  username?: string;
  cksCode?: string;
  status?: AdminUserStatus;
}
