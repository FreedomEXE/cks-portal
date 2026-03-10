/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: index.ts
 *
 * Description:
 * Calendar domain public exports.
 *
 * Responsibilities:
 * - Export route registration and projection helpers
 *
 * Role in system:
 * - Imported by server bootstrap and source-domain write paths
 *
 * Notes:
 * - Keeps the calendar domain boundary explicit
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
export { registerCalendarRoutes } from './routes.fastify.js';
export { syncOrderCalendarProjection, syncServiceCalendarProjection } from './projections.js';
