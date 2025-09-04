/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * support.ts
 * 
 * Description: Support ticket system for technical app support
 * Function: Handle user support requests separate from business reports/feedback
 * Importance: Critical - Provides admin oversight of app-related user issues
 */

import express, { Request, Response } from 'express';
import pool from '../../../Database/db/pool';
import { logger } from '../src/core/logger';
import { logActivity } from './activity';

const router = express.Router();

// Helper to generate ticket IDs
async function getNextTicketId(): Promise<string> {
  const result = await pool.query(
    'SELECT ticket_id FROM support_tickets WHERE ticket_id LIKE $1 ORDER BY ticket_id DESC LIMIT 1',
    ['ST-%']
  );
  if (result.rows.length === 0) return 'ST-001';
  const lastId: string = result.rows[0].ticket_id;
  const number = parseInt(lastId.slice(3)) + 1;
  return `ST-${number.toString().padStart(3, '0')}`;
}

// GET /api/support/tickets - Get all support tickets for admin
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { status, priority, hub, limit = 25, offset = 0 } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      whereClause += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    if (hub) {
      whereClause += ` AND user_hub = $${paramIndex}`;
      params.push(hub);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        ticket_id,
        user_id,
        user_role,
        user_hub,
        issue_type,
        priority,
        subject,
        description,
        status,
        assigned_admin,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.ticket_id) as message_count
      FROM support_tickets st
      ${whereClause}
      ORDER BY 
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM support_tickets st ${whereClause}`;
    
    const [tickets, total] = await Promise.all([
      pool.query(query, [...params, Number(limit), Number(offset)]),
      pool.query(countQuery, params)
    ]);
    
    res.json({
      success: true,
      data: tickets.rows,
      total: Number(total.rows[0].count),
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      pageSize: Number(limit)
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch support tickets');
    res.status(500).json({ success: false, error: 'Failed to fetch support tickets' });
  }
});

// GET /api/support/tickets/:id - Get specific ticket with messages
router.get('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ticketQuery = `
      SELECT * FROM support_tickets WHERE ticket_id = $1
    `;
    
    const messagesQuery = `
      SELECT * FROM support_messages 
      WHERE ticket_id = $1 
      ORDER BY created_at ASC
    `;
    
    const [ticketResult, messagesResult] = await Promise.all([
      pool.query(ticketQuery, [id]),
      pool.query(messagesQuery, [id])
    ]);
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    res.json({
      success: true,
      data: {
        ticket: ticketResult.rows[0],
        messages: messagesResult.rows
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch support ticket');
    res.status(500).json({ success: false, error: 'Failed to fetch support ticket' });
  }
});

// POST /api/support/tickets - Create new support ticket
router.post('/tickets', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      user_role,
      user_hub,
      issue_type,
      priority = 'medium',
      subject,
      description,
      steps_to_reproduce,
      browser_info,
      current_url
    } = req.body;
    
    if (!user_id || !user_role || !user_hub || !issue_type || !subject || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: user_id, user_role, user_hub, issue_type, subject, description' 
      });
    }
    
    const ticketId = await getNextTicketId();
    
    // Create ticket
    await pool.query(`
      INSERT INTO support_tickets (
        ticket_id, user_id, user_role, user_hub, issue_type, priority,
        subject, description, steps_to_reproduce, browser_info, current_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      ticketId, user_id, user_role, user_hub, issue_type, priority,
      subject, description, steps_to_reproduce, browser_info, current_url
    ]);
    
    // Create initial message
    await pool.query(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, message)
      VALUES ($1, 'user', $2, $3, $4)
    `, [ticketId, user_id, user_role.toUpperCase() + ' User', description]);
    
    // Log system activity
    await logActivity(
      'support_ticket_created',
      `New support ticket created: ${subject}`,
      user_id,
      user_role,
      ticketId,
      'ticket',
      { issue_type, priority, user_hub }
    );
    
    res.status(201).json({
      success: true,
      data: { ticket_id: ticketId },
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create support ticket');
    res.status(500).json({ success: false, error: 'Failed to create support ticket' });
  }
});

// POST /api/support/tickets/:id/messages - Add message to ticket
router.post('/tickets/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sender_type, sender_id, sender_name, message, is_internal = false } = req.body;
    
    if (!sender_type || !sender_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sender_type, sender_id, message'
      });
    }
    
    await pool.query(`
      INSERT INTO support_messages (ticket_id, sender_type, sender_id, sender_name, message, is_internal)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, sender_type, sender_id, sender_name, message, is_internal]);
    
    // Update ticket timestamp
    await pool.query(`
      UPDATE support_tickets SET updated_at = NOW() WHERE ticket_id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Message added successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to add support message');
    res.status(500).json({ success: false, error: 'Failed to add support message' });
  }
});

// PATCH /api/support/tickets/:id - Update ticket status/assignment
router.patch('/tickets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assigned_admin, admin_notes, priority } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
      
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
      }
    }
    
    if (assigned_admin !== undefined) {
      updates.push(`assigned_admin = $${paramIndex}`);
      params.push(assigned_admin);
      paramIndex++;
    }
    
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${paramIndex}`);
      params.push(admin_notes);
      paramIndex++;
    }
    
    if (priority) {
      updates.push(`priority = $${paramIndex}`);
      params.push(priority);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `
      UPDATE support_tickets 
      SET ${updates.join(', ')}
      WHERE ticket_id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    
    // Log system activity if status changed
    if (status) {
      await logActivity(
        'support_ticket_updated',
        `Support ticket ${id} status changed to ${status}`,
        assigned_admin || 'admin',
        'admin',
        id,
        'ticket',
        { new_status: status, assigned_admin }
      );
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update support ticket');
    res.status(500).json({ success: false, error: 'Failed to update support ticket' });
  }
});

// GET /api/support/stats - Get support statistics for admin dashboard
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as tickets_this_week
      FROM support_tickets
    `;
    
    const hubStatsQuery = `
      SELECT user_hub, COUNT(*) as count
      FROM support_tickets
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY user_hub
      ORDER BY count DESC
    `;
    
    const [stats, hubStats] = await Promise.all([
      pool.query(statsQuery),
      pool.query(hubStatsQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        overview: stats.rows[0],
        by_hub: hubStats.rows
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch support stats');
    res.status(500).json({ success: false, error: 'Failed to fetch support stats' });
  }
});

export default router;