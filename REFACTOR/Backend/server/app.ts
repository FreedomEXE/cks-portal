/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: app.ts
 * 
 * Description: Express app setup (JSON parser, auth attach, mounts /api/manager).
 * Function: Initialize HTTP server, register middleware, and route modules.
 * Importance: Entry point for backend server and Manager API mount.
 * Connects to: middleware/auth.ts, hub/manager/routes/index.ts.
 */

import express from 'express';
import managerRouter from './hub/manager/routes';

const app = express();

app.use(express.json());

// TODO: attach auth middleware when implemented
// app.use(auth);

app.use('/api/manager', managerRouter);

export default app;
