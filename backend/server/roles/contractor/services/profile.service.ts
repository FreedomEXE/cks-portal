/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: profile.service.ts
 * 
 * Description: Reads/updates contractor profile; enforces validation and audit.
 * Function: Handle contractor profile data management and business rules
 * Importance: Manages contractor identity and business information
 * Connects to: profile.repo.ts, validators, activity.repo.ts.
 */

import * as profileRepo from '../repositories/profile.repo';
import * as activityRepo from '../repositories/activity.repo';

// Get contractor profile
export async function getProfile(contractorId: string) {
  try {
    const profile = await profileRepo.getProfile(contractorId);
    return profile;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw new Error('Failed to load profile');
  }
}

// Update contractor profile
export async function updateProfile(contractorId: string, updateData: any) {
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
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }
}

// Get contractor capabilities and certifications
export async function getCapabilities(contractorId: string) {
  try {
    const capabilities = await profileRepo.getCapabilities(contractorId);
    return capabilities;
  } catch (error) {
    console.error('Error getting capabilities:', error);
    return [];
  }
}

// Update contractor capabilities
export async function updateCapabilities(contractorId: string, capabilities: any[]) {
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
  } catch (error) {
    console.error('Error updating capabilities:', error);
    throw new Error('Failed to update capabilities');
  }
}

// Helper function to sanitize profile data
function sanitizeProfileData(data: any) {
  // Remove sensitive fields and validate input
  const allowedFields = [
    'companyName', 'contactName', 'email', 'phone', 
    'address', 'description', 'specialties', 'preferences'
  ];
  
  const sanitized: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}