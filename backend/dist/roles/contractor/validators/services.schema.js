"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceFilterSchema = exports.ServiceUpdateSchema = exports.ServiceCreateSchema = void 0;
/**
 * File: services.schema.ts
 *
 * Description: Validates contractor service create/update DTOs.
 * Function: Validate service operations for contractor role
 * Importance: Ensures data integrity for contractor service management
 * Connects to: services.ts routes, services.service.ts.
 */
const zod_1 = require("zod");
exports.ServiceCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    pricing: zod_1.z.object({
        type: zod_1.z.enum(['fixed', 'hourly', 'negotiable']),
        amount: zod_1.z.number().positive().optional(),
        currency: zod_1.z.string().default('USD')
    }).optional(),
    availability: zod_1.z.object({
        daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)),
        timeSlots: zod_1.z.array(zod_1.z.object({
            start: zod_1.z.string(),
            end: zod_1.z.string()
        }))
    }).optional(),
    requirements: zod_1.z.array(zod_1.z.string()).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
});
exports.ServiceUpdateSchema = exports.ServiceCreateSchema.partial();
exports.ServiceFilterSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    active: zod_1.z.boolean().optional(),
    search: zod_1.z.string().optional()
});
//# sourceMappingURL=services.schema.js.map