/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: services.service.ts
 * 
 * Description: CRUD for contractor services; quotas/ownership rules.
 * Function: Handle contractor service catalog and offerings management
 * Importance: Core functionality for contractor service portfolio management
 * Connects to: services.repo.ts, validators, activity logs.
 */

import * as servicesRepo from '../repositories/services.repo';
import * as activityRepo from '../repositories/activity.repo';

// Get contractor services
export async function getServices(contractorId: string) {
  try {
    const services = await servicesRepo.getServices(contractorId);
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    return [];
  }
}

// Create new service
export async function createService(contractorId: string, serviceData: any) {
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
  } catch (error) {
    console.error('Error creating service:', error);
    throw new Error('Failed to create service');
  }
}

// Update existing service
export async function updateService(contractorId: string, serviceId: string, updateData: any) {
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
  } catch (error) {
    console.error('Error updating service:', error);
    throw new Error('Failed to update service');
  }
}

// Delete service
export async function deleteService(contractorId: string, serviceId: string) {
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
  } catch (error) {
    console.error('Error deleting service:', error);
    throw new Error('Failed to delete service');
  }
}

// Get service categories
export async function getServiceCategories() {
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
  } catch (error) {
    console.error('Error getting service categories:', error);
    return [];
  }
}

// Validate service data
function validateServiceData(data: any) {
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
  const validated: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      validated[field] = data[field];
    }
  }
  
  return validated;
}