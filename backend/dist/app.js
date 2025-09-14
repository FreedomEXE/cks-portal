"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * File: app.ts
 *
 * Description: Express app setup with hybrid role-based routing architecture
 * Function: Initialize HTTP server, register middleware, and mount role routers
 * Importance: Entry point for backend server with unified role routing
 * Connects to: Core middleware, role routers, domain factories
 */
const express_1 = __importDefault(require("express"));
const mount_1 = require("./routes/mount");
const responses_1 = require("./core/http/responses");
const errors_1 = require("./core/http/errors");
const app = (0, express_1.default)();
// Basic middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// CORS middleware
app.use(responses_1.corsMiddleware);
// Response middleware (adds request ID, timing, etc.)
app.use(responses_1.responseMiddleware);
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
(0, mount_1.mountRoleRoutes)(app);
// Global error handler (must be last)
app.use(errors_1.errorHandler);
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
exports.default = app;
//# sourceMappingURL=app.js.map