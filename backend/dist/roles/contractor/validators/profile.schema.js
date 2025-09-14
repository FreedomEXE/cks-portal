"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapabilitiesUpdateSchema = exports.ProfileUpdateSchema = void 0;
/**
 * File: profile.schema.ts
 *
 * Description: Validates contractor profile update DTOs.
 * Function: Validate profile operations for contractor role
 * Importance: Ensures data integrity for contractor profile management
 * Connects to: profile.ts routes, profile.service.ts.
 */
const zod_1 = require("zod");
exports.ProfileUpdateSchema = zod_1.z.object({
    companyName: zod_1.z.string().min(1).optional(),
    contactName: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    specialties: zod_1.z.array(zod_1.z.string()).optional(),
    preferences: zod_1.z.record(zod_1.z.any()).optional()
});
exports.CapabilitiesUpdateSchema = zod_1.z.object({
    certifications: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        issuedBy: zod_1.z.string(),
        issuedDate: zod_1.z.string().datetime(),
        expiryDate: zod_1.z.string().datetime().optional()
    })).optional(),
    skills: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        category: zod_1.z.string(),
        proficiencyLevel: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
    })).optional()
});
//# sourceMappingURL=profile.schema.js.map