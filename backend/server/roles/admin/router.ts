import { Router, RequestHandler } from 'express';
import adminRouter from '../../hubs/admin/routes';
import { createCatalogRouter } from '../../domains/catalog';

export default function createAdminRouter(): Router | RequestHandler {
  const r = Router();

  // Compose shared catalog domain first so it takes precedence over legacy routes
  r.use(
    '/catalog',
    createCatalogRouter({
      role: 'admin',
      capabilities: ['catalog:view', 'catalog:admin'],
      features: { browse: true, search: true, categories: true, admin: true },
    })
  );

  // Legacy admin hub routes (kept during transition)
  r.use(adminRouter);
  return r;
}
