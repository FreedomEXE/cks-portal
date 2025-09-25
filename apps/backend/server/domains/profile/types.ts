export type HubRole = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export interface HubRelatedContact {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface HubProfilePayload {
  role: HubRole;
  cksCode: string;
  name: string | null;
  status: string | null;
  mainContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  manager?: HubRelatedContact | null;
  contractor?: HubRelatedContact | null;
  customer?: HubRelatedContact | null;
  center?: HubRelatedContact | null;
  metadata?: Record<string, unknown> | null;
}
