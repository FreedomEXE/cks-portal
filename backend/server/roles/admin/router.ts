import { Router, RequestHandler } from 'express';
import adminRouter from '../../hubs/admin/routes';

export default function createAdminRouter(): Router | RequestHandler {
  // For now, reuse existing hub router. Domains will be composed here later.
  return adminRouter;
}

