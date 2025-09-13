/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: reports.schema.ts
 * 
 * Description: Validates contractor report request params.
 * Function: Validate report generation parameters for contractor role
 * Importance: Ensures proper report parameter validation
 * Connects to: reports.ts routes, reports.service.ts.
 */

import { z } from 'zod';

export const ReportParametersSchema = z.object({
  date_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  job_type: z.string().optional(),
  payment_status: z.enum(['paid', 'pending', 'overdue']).optional(),
  rating_threshold: z.number().min(1).max(5).optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

export const ReportTypeSchema = z.enum([
  'job-performance',
  'earnings-summary', 
  'customer-feedback'
]);

export type ReportParameters = z.infer<typeof ReportParametersSchema>;
export type ReportType = z.infer<typeof ReportTypeSchema>;