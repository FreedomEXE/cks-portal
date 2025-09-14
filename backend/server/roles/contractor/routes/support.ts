/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: support.ts
 * 
 * Description: Support/KB or ticket bootstrap endpoints (GET /support)
 * Function: Handle contractor support requests and knowledge base access
 * Importance: Provides contractor with help resources and support channels
 * Connects to: support.service.ts, external helpdesk API (if any)
 * 
 * Notes: Contractor-specific support and help functionality
 */

import { Router } from 'express';
import { requireCaps } from '../../../middleware/requireCaps';
import * as supportService from '../services/support.service';

const router = Router();

// Get support resources
router.get(
  '/',
  requireCaps('support:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const supportData = await supportService.getSupportResources(contractorId);
      res.json({ success: true, data: supportData });
    } catch (error) {
      console.error('Support fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load support data' });
    }
  }
);

// Submit support ticket
router.post(
  '/ticket',
  requireCaps('support:create'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const ticket = await supportService.createSupportTicket(contractorId, req.body);
      res.json({ success: true, data: ticket });
    } catch (error) {
      console.error('Support ticket creation error:', error);
      res.status(500).json({ success: false, error: 'Failed to create support ticket' });
    }
  }
);

// Get knowledge base articles
router.get(
  '/kb',
  requireCaps('support:view'),
  async (req: any, res) => {
    try {
      const contractorId = req.user?.userId;
      if (!contractorId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
      }

      const kbArticles = await supportService.getKnowledgeBase(contractorId, req.query);
      res.json({ success: true, data: kbArticles });
    } catch (error) {
      console.error('KB fetch error:', error);
      res.status(500).json({ success: false, error: 'Failed to load knowledge base' });
    }
  }
);

export default router;