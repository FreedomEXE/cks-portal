/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: orders.schema.ts
 * 
 * Description: Validates contractor order create/update DTOs.
 * Function: Validate order operations for contractor role
 * Importance: Ensures data integrity for contractor order management
 * Connects to: orders.ts routes, orders.service.ts.
 */

import { z } from 'zod';

export const OrderUpdateSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  progress_notes: z.string().optional(),
  completed_date: z.string().datetime().optional()
});

export const OrderFilterSchema = z.object({
  status: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0)
});

export type OrderUpdate = z.infer<typeof OrderUpdateSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;