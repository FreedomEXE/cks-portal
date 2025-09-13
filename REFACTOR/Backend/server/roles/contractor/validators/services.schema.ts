/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.schema.ts
 * 
 * Description: Validates contractor service create/update DTOs.
 * Function: Validate service operations for contractor role
 * Importance: Ensures data integrity for contractor service management
 * Connects to: services.ts routes, services.service.ts.
 */

import { z } from 'zod';

export const ServiceCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  pricing: z.object({
    type: z.enum(['fixed', 'hourly', 'negotiable']),
    amount: z.number().positive().optional(),
    currency: z.string().default('USD')
  }).optional(),
  availability: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)),
    timeSlots: z.array(z.object({
      start: z.string(),
      end: z.string()
    }))
  }).optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial();

export const ServiceFilterSchema = z.object({
  category: z.string().optional(),
  active: z.boolean().optional(),
  search: z.string().optional()
});

export type ServiceCreate = z.infer<typeof ServiceCreateSchema>;
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>;
export type ServiceFilter = z.infer<typeof ServiceFilterSchema>;