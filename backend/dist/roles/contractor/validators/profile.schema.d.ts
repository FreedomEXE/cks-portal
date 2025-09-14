/**
 * File: profile.schema.ts
 *
 * Description: Validates contractor profile update DTOs.
 * Function: Validate profile operations for contractor role
 * Importance: Ensures data integrity for contractor profile management
 * Connects to: profile.ts routes, profile.service.ts.
 */
import { z } from 'zod';
export declare const ProfileUpdateSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    contactName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    specialties: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    preferences?: Record<string, any> | undefined;
    address?: string | undefined;
    specialties?: string[] | undefined;
    companyName?: string | undefined;
    contactName?: string | undefined;
}, {
    description?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    preferences?: Record<string, any> | undefined;
    address?: string | undefined;
    specialties?: string[] | undefined;
    companyName?: string | undefined;
    contactName?: string | undefined;
}>;
export declare const CapabilitiesUpdateSchema: z.ZodObject<{
    certifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        issuedBy: z.ZodString;
        issuedDate: z.ZodString;
        expiryDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        issuedBy: string;
        issuedDate: string;
        expiryDate?: string | undefined;
    }, {
        name: string;
        issuedBy: string;
        issuedDate: string;
        expiryDate?: string | undefined;
    }>, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        category: z.ZodString;
        proficiencyLevel: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
    }, "strip", z.ZodTypeAny, {
        category: string;
        name: string;
        proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
    }, {
        category: string;
        name: string;
        proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    certifications?: {
        name: string;
        issuedBy: string;
        issuedDate: string;
        expiryDate?: string | undefined;
    }[] | undefined;
    skills?: {
        category: string;
        name: string;
        proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
    }[] | undefined;
}, {
    certifications?: {
        name: string;
        issuedBy: string;
        issuedDate: string;
        expiryDate?: string | undefined;
    }[] | undefined;
    skills?: {
        category: string;
        name: string;
        proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
    }[] | undefined;
}>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type CapabilitiesUpdate = z.infer<typeof CapabilitiesUpdateSchema>;
//# sourceMappingURL=profile.schema.d.ts.map