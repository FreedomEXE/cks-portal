/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: app.ts
 *
 * Description: Express app setup with hybrid role-based routing architecture
 * Function: Initialize HTTP server, register middleware, and mount role routers
 * Importance: Entry point for backend server with unified role routing
 * Connects to: Core middleware, role routers, domain factories
 */

import express from 'express';
import cors from 'cors';
import { mountRoleRoutes } from './routes/mount';
import { responseMiddleware, corsMiddleware } from './core/http/responses';
import { errorHandler } from './core/http/errors';

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use(corsMiddleware);

// Response middleware (adds request ID, timing, etc.)
app.use(responseMiddleware);

// Health check at root
app.get('/', (req, res) => {
  res.json({
    name: 'CKS Portal API',
    version: process.env.API_VERSION || 'v1',
    status: 'operational',
    timestamp: new Date().toISOString(),
    docs: '/api/docs'
  });
});

// Mount role-based routing system
mountRoleRoutes(app);

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

export default app;
