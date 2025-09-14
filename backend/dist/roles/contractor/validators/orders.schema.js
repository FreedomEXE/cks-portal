"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderFilterSchema = exports.OrderUpdateSchema = void 0;
/**
 * File: orders.schema.ts
 *
 * Description: Validates contractor order create/update DTOs.
 * Function: Validate order operations for contractor role
 * Importance: Ensures data integrity for contractor order management
 * Connects to: orders.ts routes, orders.service.ts.
 */
const zod_1 = require("zod");
exports.OrderUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['accepted', 'in_progress', 'completed', 'cancelled']).optional(),
    notes: zod_1.z.string().optional(),
    progress_notes: zod_1.z.string().optional(),
    completed_date: zod_1.z.string().datetime().optional()
});
exports.OrderFilterSchema = zod_1.z.object({
    status: zod_1.z.string().optional(),
    date_from: zod_1.z.string().optional(),
    date_to: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().default(50),
    offset: zod_1.z.coerce.number().default(0)
});
//# sourceMappingURL=orders.schema.js.map