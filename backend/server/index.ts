/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Server entry point for CKS Manager backend
 * Function: Start the Express server and initialize database connection
 * Importance: Main entry point for backend services
 * Connects to: app.ts, database connection
 * 
 * Notes: Development server for Manager role testing
 */

import 'dotenv/config';
import { buildServer } from './fastify';
import { testConnection } from './db/connection';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Test database connection on startup
async function startServer() {
  console.log('🚀 Starting CKS Portal Backend Server (Fastify)...');

  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (dbConnected) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️  Database connection failed - server will start but queries may fail');
    }

    // Build and start the Fastify server
    const app = buildServer();

    await app.listen({ port: Number(PORT), host: HOST });

    console.log(`🟢 Server running on http://localhost:${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api/docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`📦 Global Catalog: http://localhost:${PORT}/api/catalog`);
    console.log(`📊 Manager Dashboard: http://localhost:${PORT}/api/manager/dashboard/health`);
    console.log(`👤 Admin Dashboard: http://localhost:${PORT}/api/admin/dashboard/health`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
