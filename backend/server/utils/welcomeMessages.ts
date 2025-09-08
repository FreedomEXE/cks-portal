/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * welcomeMessages.ts
 * 
 * Description: Welcome message utilities for new user onboarding
 * Function: Send welcome messages to newly created users
 * Importance: User experience - First impression for new users
 */

import { logActivity } from '../resources/activity';

const logger = {
  error: (...args: any[]) => console.error(...args),
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
};

export interface WelcomeMessageData {
  userId: string;
  userName: string;
  userRole: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse' | 'admin';
  email?: string;
}

/**
 * Send welcome message to newly created user
 */
export async function sendWelcomeMessage(data: WelcomeMessageData, actorId?: string, options?: { suppressActivityLog?: boolean }): Promise<void> {
  try {
    const { userId, userName, userRole, email } = data;
    
    // Generate role-specific welcome message
    const welcomeMessage = generateWelcomeMessage(userRole, userName, userId);
    
    // Optionally log welcome message activity (suppressed during user creation consolidation)
    if (!options?.suppressActivityLog) {
      await logActivity(
        'user_welcome',
        `Welcome message sent to ${userRole} ${userId} (${userName})`,
        actorId || 'system',
        'admin',
        userId,
        userRole,
        {
          email: email || null,
          message_type: 'welcome',
          message_content: welcomeMessage
        }
      );
    }
    
    // In a real implementation, this would send an email, SMS, or in-app notification
    // For now, we'll just log it
    logger.info(`Welcome message sent to ${userRole} ${userId}: ${welcomeMessage}`);
    
  } catch (error) {
    logger.error('Failed to send welcome message:', error);
  }
}

/**
 * Generate role-specific welcome message
 */
function generateWelcomeMessage(role: string, name: string, userId: string): string {
  const baseMessage = `Welcome to CKS Portal, ${name}!`;
  
  switch (role) {
    case 'manager':
      return `${baseMessage} Your manager ID is ${userId}. You can now access the Manager Hub to oversee contractors, customers, and crew operations. Get started by reviewing your assigned contractors and checking pending requests.`;
      
    case 'contractor':
      return `${baseMessage} Your contractor ID is ${userId}. You can now access the Contractor Hub to manage your services, view customer assignments, and track your business operations with CKS.`;
      
    case 'customer':
      return `${baseMessage} Your customer ID is ${userId}. You can now access the Customer Hub to request services, manage your projects, and coordinate with your assigned contractors through CKS.`;
      
    case 'center':
      return `${baseMessage} Your center ID is ${userId}. You can now access the Center Hub to coordinate crew operations and manage facility-based activities for your location.`;
      
    case 'crew':
      return `${baseMessage} Your crew ID is ${userId}. You can now access the Crew Hub to view your assignments, update task status, and coordinate with your center managers.`;
      
    case 'warehouse':
      return `${baseMessage} Your warehouse ID is ${userId}. You can now access the Warehouse Hub to manage inventory, process shipments, and coordinate logistics operations.`;
      
    case 'admin':
      return `${baseMessage} Your admin ID is ${userId}. You have full system access to manage all users, monitor system activity, and oversee CKS Portal operations.`;
      
    default:
      return `${baseMessage} Your user ID is ${userId}. Welcome to the CKS Portal system.`;
  }
}

/**
 * Send bulk welcome messages for multiple users
 */
export async function sendBulkWelcomeMessages(users: WelcomeMessageData[], actorId?: string): Promise<void> {
  for (const user of users) {
    await sendWelcomeMessage(user, actorId);
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
