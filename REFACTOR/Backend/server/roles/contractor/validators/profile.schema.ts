/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: profile.schema.ts
 * 
 * Description: Validates contractor profile update DTOs.
 * Function: Validate profile operations for contractor role
 * Importance: Ensures data integrity for contractor profile management
 * Connects to: profile.ts routes, profile.service.ts.
 */

import { z } from 'zod';

export const ProfileUpdateSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional()
});

export const CapabilitiesUpdateSchema = z.object({
  certifications: z.array(z.object({
    name: z.string(),
    issuedBy: z.string(),
    issuedDate: z.string().datetime(),
    expiryDate: z.string().datetime().optional()
  })).optional(),
  skills: z.array(z.object({
    name: z.string(),
    category: z.string(),
    proficiencyLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
  })).optional()
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type CapabilitiesUpdate = z.infer<typeof CapabilitiesUpdateSchema>;