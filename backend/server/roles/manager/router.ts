import { Router, RequestHandler } from 'express';
import managerRouter from '../../hubs/manager/routes';
import { createCatalogRouter } from '../../domains/catalog';

export default function createManagerRouter(): Router | RequestHandler {
  const r = Router();

  // Read-only catalog for manager (browse/search/categories)
  r.use(
    '/catalog',
    createCatalogRouter({
      role: 'manager',
      capabilities: ['catalog:view'],
      features: { browse: true, search: true, categories: true },
    })
  );

  r.use(managerRouter);
  return r;
}
