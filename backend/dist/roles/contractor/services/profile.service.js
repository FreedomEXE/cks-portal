"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.getCapabilities = getCapabilities;
exports.updateCapabilities = updateCapabilities;
/**
 * File: profile.service.ts
 *
 * Description: Reads/updates contractor profile; enforces validation and audit.
 * Function: Handle contractor profile data management and business rules
 * Importance: Manages contractor identity and business information
 * Connects to: profile.repo.ts, validators, activity.repo.ts.
 */
const profileRepo = __importStar(require("../repositories/profile.repo"));
const activityRepo = __importStar(require("../repositories/activity.repo"));
// Get contractor profile
async function getProfile(contractorId) {
    try {
        const profile = await profileRepo.getProfile(contractorId);
        return profile;
    }
    catch (error) {
        console.error('Error getting profile:', error);
        throw new Error('Failed to load profile');
    }
}
// Update contractor profile
async function updateProfile(contractorId, updateData) {
    try {
        // Validate and sanitize update data
        const sanitizedData = sanitizeProfileData(updateData);
        const updatedProfile = await profileRepo.updateProfile(contractorId, sanitizedData);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'profile_updated',
            entityType: 'profile',
            entityId: contractorId,
            description: 'Contractor profile updated',
            metadata: { updatedFields: Object.keys(sanitizedData) }
        });
        return updatedProfile;
    }
    catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }
}
// Get contractor capabilities and certifications
async function getCapabilities(contractorId) {
    try {
        const capabilities = await profileRepo.getCapabilities(contractorId);
        return capabilities;
    }
    catch (error) {
        console.error('Error getting capabilities:', error);
        return [];
    }
}
// Update contractor capabilities
async function updateCapabilities(contractorId, capabilities) {
    try {
        const updatedCapabilities = await profileRepo.updateCapabilities(contractorId, capabilities);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'capabilities_updated',
            entityType: 'profile',
            entityId: contractorId,
            description: 'Contractor capabilities updated',
            metadata: { capabilityCount: capabilities.length }
        });
        return updatedCapabilities;
    }
    catch (error) {
        console.error('Error updating capabilities:', error);
        throw new Error('Failed to update capabilities');
    }
}
// Helper function to sanitize profile data
function sanitizeProfileData(data) {
    // Remove sensitive fields and validate input
    const allowedFields = [
        'companyName', 'contactName', 'email', 'phone',
        'address', 'description', 'specialties', 'preferences'
    ];
    const sanitized = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            sanitized[field] = data[field];
        }
    }
    return sanitized;
}
//# sourceMappingURL=profile.service.js.map