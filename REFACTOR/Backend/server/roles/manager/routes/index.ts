/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: index.ts
 * 
 * Description: Registers manager subroutes under /api/manager.
 * Function: Compose and mount route handlers for Manager module.
 * Importance: Centralizes Manager routing surface.
 * Connects to: dashboard.ts, profile.ts, services.ts, ecosystem.ts, orders.ts, reports.ts, support.ts.
 */

import { Router } from 'express';
import dashboard from './dashboard';

const router = Router();

router.use('/dashboard', dashboard);

export default router;
