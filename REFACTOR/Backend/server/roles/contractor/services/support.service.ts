/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: support.service.ts
 * 
 * Description: Retrieves support content or opens a ticket stub.
 * Function: Handle contractor support requests and knowledge base access
 * Importance: Provides contractor help resources and assistance channels
 * Connects to: Support repo or external API.
 */

import * as activityRepo from '../repositories/activity.repo';

// Get support resources for contractor
export async function getSupportResources(contractorId: string) {
  try {
    return {
      quickHelp: [
        {
          title: 'Getting Started Guide',
          description: 'Learn the basics of using the contractor portal',
          category: 'onboarding',
          url: '/support/getting-started'
        },
        {
          title: 'Job Management',
          description: 'How to accept, manage, and complete jobs',
          category: 'jobs',
          url: '/support/job-management'
        },
        {
          title: 'Payment & Billing',
          description: 'Understanding payments and invoicing',
          category: 'billing',
          url: '/support/payments'
        }
      ],
      contactOptions: [
        {
          type: 'chat',
          label: 'Live Chat',
          available: true,
          hours: 'Mon-Fri 8AM-6PM EST'
        },
        {
          type: 'email',
          label: 'Email Support',
          available: true,
          address: 'contractor-support@cks.com'
        },
        {
          type: 'phone',
          label: 'Phone Support',
          available: true,
          number: '1-800-CKS-HELP'
        }
      ],
      announcements: [
        {
          title: 'System Maintenance Scheduled',
          date: new Date(),
          type: 'maintenance',
          message: 'Brief maintenance window this weekend'
        }
      ]
    };
  } catch (error) {
    console.error('Error getting support resources:', error);
    return { quickHelp: [], contactOptions: [], announcements: [] };
  }
}

// Create support ticket
export async function createSupportTicket(contractorId: string, ticketData: any) {
  try {
    // Validate ticket data
    const validatedData = validateTicketData(ticketData);
    
    // Create ticket (placeholder - would integrate with ticketing system)
    const ticket = {
      id: `TICKET-${Date.now()}`,
      contractorId,
      subject: validatedData.subject,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priority || 'medium',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Log the activity
    await activityRepo.logActivity({
      userId: contractorId,
      action: 'support_ticket_created',
      entityType: 'ticket',
      entityId: ticket.id,
      description: `Support ticket created: ${validatedData.subject}`,
      metadata: { category: validatedData.category, priority: validatedData.priority }
    });

    return ticket;
  } catch (error) {
    console.error('Error creating support ticket:', error);
    throw new Error('Failed to create support ticket');
  }
}

// Get knowledge base articles
export async function getKnowledgeBase(contractorId: string, searchParams: any) {
  try {
    const { category, search, limit = 10 } = searchParams;
    
    // Placeholder implementation - would query knowledge base
    const articles = [
      {
        id: 'kb-001',
        title: 'How to Complete Your Profile',
        category: 'profile',
        summary: 'Step-by-step guide to completing your contractor profile',
        lastUpdated: new Date(),
        helpful: 15,
        views: 245
      },
      {
        id: 'kb-002',
        title: 'Understanding Job Requirements',
        category: 'jobs',
        summary: 'Learn how to read and understand job requirements',
        lastUpdated: new Date(),
        helpful: 23,
        views: 189
      },
      {
        id: 'kb-003',
        title: 'Payment Schedule and Methods',
        category: 'billing',
        summary: 'Information about payment schedules and available payment methods',
        lastUpdated: new Date(),
        helpful: 31,
        views: 412
      }
    ];

    // Filter by category if provided
    const filteredArticles = category 
      ? articles.filter(article => article.category === category)
      : articles;

    // Filter by search term if provided
    const searchResults = search
      ? filteredArticles.filter(article => 
          article.title.toLowerCase().includes(search.toLowerCase()) ||
          article.summary.toLowerCase().includes(search.toLowerCase())
        )
      : filteredArticles;

    return {
      articles: searchResults.slice(0, limit),
      total: searchResults.length,
      categories: ['profile', 'jobs', 'billing', 'general'],
      searchTerm: search || null
    };
  } catch (error) {
    console.error('Error getting knowledge base:', error);
    return { articles: [], total: 0, categories: [], searchTerm: null };
  }
}

// Validate ticket data
function validateTicketData(data: any) {
  const requiredFields = ['subject', 'description', 'category'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  const allowedCategories = ['technical', 'billing', 'jobs', 'profile', 'general'];
  if (!allowedCategories.includes(data.category)) {
    throw new Error('Invalid category');
  }
  
  return {
    subject: data.subject.trim(),
    description: data.description.trim(),
    category: data.category,
    priority: data.priority || 'medium'
  };
}