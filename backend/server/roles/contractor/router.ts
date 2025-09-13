import { Router, RequestHandler } from 'express';
import contractorRouter from '../../hubs/contractor/routes';
import { createCatalogRouter } from '../../domains/catalog';

export default function createContractorRouter(): Router | RequestHandler {
  const r = Router();

  // Read-only catalog for contractor initially (myServices later)
  r.use(
    '/catalog',
    createCatalogRouter({
      role: 'contractor',
      capabilities: ['catalog:view'],
      features: { browse: true, search: true, categories: true, myServices: false },
    })
  );

  r.use(contractorRouter);
  return r;
}
