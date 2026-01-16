import { z } from 'zod';

export const accessTierSchema = z.enum(['standard', 'premium']);

export const createAccessCodeSchema = z.object({
  targetRole: z.string().trim().min(1),
  tier: accessTierSchema.optional(),
  maxRedemptions: z.number().int().min(1).max(1000).optional(),
  scopeCode: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
  expiresAt: z.string().trim().min(1).optional(),
});

export const redeemAccessCodeSchema = z.object({
  code: z.string().trim().min(4),
});
