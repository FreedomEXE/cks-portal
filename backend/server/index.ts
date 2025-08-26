/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.ts
 * 
 * Description: Primary Express server with unified API routing
 * Function: Bootstraps server with middleware, database, and modular routes
 * Importance: Critical - Core HTTP surface for entire CKS platform
 * Connects to: All route modules, database pool, authentication middleware
 * 
 * Notes: All routes mounted under /api for consistency.
 *        Simplified role detection using modern ID prefixes.
 *        Removed duplicate route definitions.
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './src/core/env';
import { logger, httpLogger } from './src/core/logger';
import { notFound, errorHandler } from './src/core/errors';
import { metricsMiddleware, metricsHandler } from './src/core/metrics';
import pool from './db/pool';  
import meRouter from './routes/me';
import hubsRouter from './routes/hubs';
import crewRouter from './routes/crew';
import managerRouter from './routes/manager';
import customerRouter from './routes/customer';
import contractorRouter from './routes/contractor';

const app = express();

// Security & middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(httpLogger);
app.use(metricsMiddleware);
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  message: 'Too many requests from this IP'
}));

// Health & status endpoints (no /api prefix for monitoring)
app.get('/', (_req, res) => res.json({ ok: true, service: 'cks-api', version: '2.0.0' }));
app.get('/health', (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
app.get('/test-db', async (_req, res) => {
  try { 
    await pool.query('SELECT 1'); 
    res.json({ ok: true, database: 'connected' }); 
  } catch (e: any) { 
    res.status(500).json({ error: 'Database connection failed', details: e.message }); 
  }
});

// Admin list endpoints with modern query building
app.get('/api/admin/crew', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (crew_id || ' ' || COALESCE(name,'') || ' ' || COALESCE(email,'') || ' ' || COALESCE(phone,'')) ILIKE $1`;
    }
    
    const query = `
      SELECT crew_id, name, status, role, address, phone, email, assigned_center
      FROM crew ${whereClause}
      ORDER BY crew_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM crew ${whereClause}`;
    
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin crew list error');
    res.status(500).json({ error: 'Failed to fetch crew list' });
  }
});

app.get('/api/admin/contractors', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (contractor_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    
    const query = `
      SELECT contractor_id, cks_manager, company_name, num_customers, main_contact, address, phone, email
      FROM contractors ${whereClause}
      ORDER BY contractor_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM contractors ${whereClause}`;
    
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin contractors list error');
    res.status(500).json({ error: 'Failed to fetch contractors list' });
  }
});

app.get('/api/admin/customers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (customer_id || ' ' || COALESCE(company_name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    
    const query = `
      SELECT customer_id, cks_manager, company_name, num_centers, main_contact, address, phone, email
      FROM customers ${whereClause}
      ORDER BY customer_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin customers list error');
    res.status(500).json({ error: 'Failed to fetch customers list' });
  }
});

app.get('/api/admin/centers', async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '25'), 10), 100);
    const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10), 0);
    const search = String(req.query.q ?? '').trim();
    
    let whereClause = '';
    const values: any[] = [];
    
    if (search) {
      values.push(`%${search}%`);
      whereClause = `WHERE (center_id || ' ' || COALESCE(name,'') || ' ' || COALESCE(email,'')) ILIKE $1`;
    }
    
    const query = `
      SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
      FROM centers ${whereClause}
      ORDER BY center_id
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM centers ${whereClause}`;
    
    const [items, total] = await Promise.all([
      pool.query(query, [...values, limit, offset]),
      pool.query(countQuery, values)
    ]);
    
    res.json({ 
      items: items.rows, 
      total: Number(total.rows[0].count),
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    });
  } catch (e: any) {
    logger.error({ error: e }, 'Admin centers list error');
    res.status(500).json({ error: 'Failed to fetch centers list' });
  }
});

// Mount modular routes - ALL under /api for consistency
app.use('/api', meRouter);
app.use('/api/hub', hubsRouter);
app.use('/api/crew', crewRouter);
app.use('/api/manager', managerRouter);
app.use('/api/customer', customerRouter);
app.use('/api/contractor', contractorRouter);

// Swagger documentation
const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CKS Portal API',
    version: '2.0.0',
    description: 'Unified API for CKS Portal platform'
  }
};
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling
app.use(notFound);
app.use(errorHandler as unknown as (err: Error, req: Request, res: Response, next: NextFunction) => void);

// Server startup
const PORT = Number(env.PORT || 5000);
app.listen(PORT, () => {
  logger.info({ port: PORT }, `CKS API listening on port ${PORT}`);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation at http://localhost:${PORT}/api/docs`);
});
