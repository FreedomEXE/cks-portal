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
import pool from '../../Database/db/pool';  
import meRouter from './routes/me';
import hubsRouter from './routes/hubs';
import createRoleMountRouter from './routes/mount';
import { roleContext } from './src/auth/roleContext';
import adminRouter from './hubs/admin/routes';
import crewRouter from './hubs/crew/routes';
import managerRouter from './hubs/manager/routes';
import customerRouter from './hubs/customer/routes';
import contractorRouter from './hubs/contractor/routes';
import centerRouter from './hubs/center/routes';
import warehouseRouter from './hubs/warehouse/routes';
import { createCatalogRouter } from './domains/catalog';
import ordersRouter from './resources/orders';
import reportsRouter from './resources/reports';
import feedbackRouter from './resources/feedback';
import supportRouter from './resources/support';
import activityRouter from './resources/activity';
import metricsRouter from './resources/metrics';

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





// Mount modular routes - ALL under /api for consistency
app.use('/api', meRouter);
app.use('/api/hub', hubsRouter);
// Hybrid mount: shared /api/:role router that dispatches by URL param
app.use('/api/:role', roleContext, createRoleMountRouter());
app.use('/api/admin', adminRouter);
app.use('/api/crew', crewRouter);
app.use('/api/manager', managerRouter);
app.use('/api/customer', customerRouter);
app.use('/api/contractor', contractorRouter);
app.use('/api/center', centerRouter);
app.use('/api/warehouse', warehouseRouter);
// Global catalog (accessible to all authenticated users)
app.use('/api/catalog', createCatalogRouter({
  role: 'global',
  capabilities: ['catalog:view'],
  features: {
    browse: true,
    search: true,
    categories: true,
    myServices: false,
    admin: false
  }
}));
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/support', supportRouter);
app.use('/api/activity', activityRouter);
app.use('/api/metrics', metricsRouter);

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
