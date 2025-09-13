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

import app from './app';
import { testConnection } from './db/connection';

const PORT = process.env.PORT || 3001;

// Test database connection on startup
async function startServer() {
  console.log('🚀 Starting CKS Manager Backend Server...');
  
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (dbConnected) {
      console.log('✅ Database connection established');
    } else {
      console.log('⚠️  Database connection failed - server will start but queries may fail');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🟢 Server running on http://localhost:${PORT}`);
      console.log(`📊 Manager Dashboard API: http://localhost:${PORT}/api/manager/dashboard/kpis`);
      console.log(`📈 Manager Dashboard Data: http://localhost:${PORT}/api/manager/dashboard/data`);
      console.log(`📋 Manager Orders: http://localhost:${PORT}/api/manager/dashboard/orders`);
    });
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