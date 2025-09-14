"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportTypeSchema = exports.ReportParametersSchema = void 0;
/**
 * File: reports.schema.ts
 *
 * Description: Validates contractor report request params.
 * Function: Validate report generation parameters for contractor role
 * Importance: Ensures proper report parameter validation
 * Connects to: reports.ts routes, reports.service.ts.
 */
const zod_1 = require("zod");
exports.ReportParametersSchema = zod_1.z.object({
    date_range: zod_1.z.object({
        start: zod_1.z.string().datetime(),
        end: zod_1.z.string().datetime()
    }).optional(),
    job_type: zod_1.z.string().optional(),
    payment_status: zod_1.z.enum(['paid', 'pending', 'overdue']).optional(),
    rating_threshold: zod_1.z.number().min(1).max(5).optional(),
    format: zod_1.z.enum(['json', 'csv', 'pdf']).default('json')
});
exports.ReportTypeSchema = zod_1.z.enum([
    'job-performance',
    'earnings-summary',
    'customer-feedback'
]);
//# sourceMappingURL=reports.schema.js.map