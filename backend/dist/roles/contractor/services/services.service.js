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
exports.getServices = getServices;
exports.createService = createService;
exports.updateService = updateService;
exports.deleteService = deleteService;
exports.getServiceCategories = getServiceCategories;
/**
 * File: services.service.ts
 *
 * Description: CRUD for contractor services; quotas/ownership rules.
 * Function: Handle contractor service catalog and offerings management
 * Importance: Core functionality for contractor service portfolio management
 * Connects to: services.repo.ts, validators, activity logs.
 */
const servicesRepo = __importStar(require("../repositories/services.repo"));
const activityRepo = __importStar(require("../repositories/activity.repo"));
// Get contractor services
async function getServices(contractorId) {
    try {
        const services = await servicesRepo.getServices(contractorId);
        return services;
    }
    catch (error) {
        console.error('Error getting services:', error);
        return [];
    }
}
// Create new service
async function createService(contractorId, serviceData) {
    try {
        // Validate service data
        const validatedData = validateServiceData(serviceData);
        const newService = await servicesRepo.createService(contractorId, validatedData);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'service_created',
            entityType: 'service',
            entityId: newService.id,
            description: `New service '${serviceData.name}' created`,
            metadata: { serviceName: serviceData.name, category: serviceData.category }
        });
        return newService;
    }
    catch (error) {
        console.error('Error creating service:', error);
        throw new Error('Failed to create service');
    }
}
// Update existing service
async function updateService(contractorId, serviceId, updateData) {
    try {
        // Validate update data
        const validatedData = validateServiceData(updateData);
        const updatedService = await servicesRepo.updateService(contractorId, serviceId, validatedData);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'service_updated',
            entityType: 'service',
            entityId: serviceId,
            description: `Service ${serviceId} updated`,
            metadata: { updatedFields: Object.keys(validatedData) }
        });
        return updatedService;
    }
    catch (error) {
        console.error('Error updating service:', error);
        throw new Error('Failed to update service');
    }
}
// Delete service
async function deleteService(contractorId, serviceId) {
    try {
        await servicesRepo.deleteService(contractorId, serviceId);
        // Log the activity
        await activityRepo.logActivity({
            userId: contractorId,
            action: 'service_deleted',
            entityType: 'service',
            entityId: serviceId,
            description: `Service ${serviceId} deleted`,
            metadata: { deletedAt: new Date() }
        });
        return { success: true, message: 'Service deleted successfully' };
    }
    catch (error) {
        console.error('Error deleting service:', error);
        throw new Error('Failed to delete service');
    }
}
// Get service categories
async function getServiceCategories() {
    try {
        return [
            'Cleaning & Maintenance',
            'Landscaping & Grounds',
            'Security Services',
            'Food Services',
            'Technical Services',
            'Administrative Support',
            'Specialty Services'
        ];
    }
    catch (error) {
        console.error('Error getting service categories:', error);
        return [];
    }
}
// Validate service data
function validateServiceData(data) {
    const requiredFields = ['name', 'category', 'description'];
    const allowedFields = [
        'name', 'category', 'description', 'pricing',
        'availability', 'requirements', 'tags'
    ];
    // Check required fields
    for (const field of requiredFields) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    // Filter allowed fields
    const validated = {};
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            validated[field] = data[field];
        }
    }
    return validated;
}
//# sourceMappingURL=services.service.js.map