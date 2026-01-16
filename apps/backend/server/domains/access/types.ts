export type AccessTier = 'standard' | 'premium';
export type AccessCodeStatus = 'active' | 'redeemed' | 'revoked' | 'expired';
export type AccessGrantStatus = 'active' | 'revoked';

export interface AccessCodeRecord {
  code: string;
  targetRole: string;
  tier: AccessTier;
  status: AccessCodeStatus;
  maxRedemptions: number;
  redeemedCount: number;
  scopeRole: string | null;
  scopeCode: string | null;
  cascade: boolean;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccessGrantRecord {
  grantId: number;
  cksCode: string;
  role: string;
  tier: AccessTier;
  status: AccessGrantStatus;
  sourceCode: string;
  cascade: boolean;
  grantedByRole: string | null;
  grantedByCode: string | null;
  grantedAt: string;
  revokedAt: string | null;
}
