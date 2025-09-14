/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: routes.factory.ts
 *
 * Description: Catalog domain route factory
 * Function: Creates role-specific catalog routers with configuration
 * Importance: Enables role-based catalog features while sharing logic
 * Connects to: Role configurations, catalog service, auth middleware
 */

import { Router } from 'express';
import { CatalogService } from './service';
import { CatalogRepository } from './repository';
import { CatalogRouteConfig } from './types';
import { requireCaps } from '../../core/auth/requireCaps';
import { ResponseHelpers } from '../../core/http/responses';
import { ErrorHelpers } from '../../core/http/errors';
import pool from '../../db/connection';

export function createCatalogRouter(config: CatalogRouteConfig): Router {
  const router = Router();
  const repository = new CatalogRepository(pool);
  const service = new CatalogService(repository);

  // GET /items - Browse catalog items (services and products)
  if (config.features.browse) {
    router.get('/items', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const query = {
          q: req.query.q as string,
          category: req.query.category as string,
          type: req.query.type as 'service' | 'product',
          active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
          limit: parseInt(req.query.limit as string) || undefined,
          offset: parseInt(req.query.offset as string) || undefined,
        };

        const items = await service.getCatalogItems(query);
        ResponseHelpers.ok(res, items);
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to fetch catalog items', error);
      }
    });
  }

  // GET /categories - Get available categories
  if (config.features.categories) {
    router.get('/categories', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const categories = await service.getCategories();
        ResponseHelpers.ok(res, categories);
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to fetch categories', error);
      }
    });

    // GET /categories/tree - Get hierarchical categories
    router.get('/categories/tree', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const tree = await service.getCategoriesTree();
        ResponseHelpers.ok(res, tree);
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to fetch category tree', error);
      }
    });
  }

  // GET /search - Search catalog (convenience endpoint)
  if (config.features.search) {
    router.get('/search', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const searchTerm = req.query.q as string;
        if (!searchTerm?.trim()) {
          return ErrorHelpers.badRequest(req, res, 'Search term required');
        }

        const options = {
          type: req.query.type as 'service' | 'product' | undefined,
          category: req.query.category as string | undefined,
          limit: parseInt(req.query.limit as string) || undefined,
        };

        const items = await service.searchCatalog(searchTerm, options);
        ResponseHelpers.ok(res, items);
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Search failed', error);
      }
    });
  }

  // Contractor-specific "My Services" routes
  if (config.features.myServices) {
    // GET /my-services - Get contractor's services
    router.get('/my-services', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const contractorId = req.headers['x-entity-id'] as string;
        if (!contractorId) {
          return ErrorHelpers.badRequest(req, res, 'Contractor context missing');
        }

        const services = await service.getContractorServices(contractorId);
        ResponseHelpers.ok(res, services);
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to fetch contractor services', error);
      }
    });

    // POST /my-services/add - Add service to contractor's offerings
    router.post('/my-services/add', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const contractorId = req.headers['x-entity-id'] as string;
        const { service_id } = req.body;

        if (!contractorId) {
          return ErrorHelpers.badRequest(req, res, 'Contractor context missing');
        }

        if (!service_id) {
          return ErrorHelpers.badRequest(req, res, 'Service ID required');
        }

        await service.addContractorService(contractorId, parseInt(service_id));
        ResponseHelpers.ok(res, { message: 'Service added successfully' });
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to add service', error);
      }
    });

    // PUT /my-services/:serviceId - Update contractor service settings
    router.put('/my-services/:serviceId', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const contractorId = req.headers['x-entity-id'] as string;
        const serviceId = parseInt(req.params.serviceId);
        const updates = req.body;

        if (!contractorId) {
          return ErrorHelpers.badRequest(req, res, 'Contractor context missing');
        }

        if (isNaN(serviceId)) {
          return ErrorHelpers.badRequest(req, res, 'Invalid service ID');
        }

        await service.updateContractorService(contractorId, serviceId, updates);
        ResponseHelpers.ok(res, { message: 'Service updated successfully' });
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to update service', error);
      }
    });

    // DELETE /my-services/:serviceId - Remove service from contractor's offerings
    router.delete('/my-services/:serviceId', requireCaps(config.capabilities.view), async (req, res) => {
      try {
        const contractorId = req.headers['x-entity-id'] as string;
        const serviceId = parseInt(req.params.serviceId);

        if (!contractorId) {
          return ErrorHelpers.badRequest(req, res, 'Contractor context missing');
        }

        if (isNaN(serviceId)) {
          return ErrorHelpers.badRequest(req, res, 'Invalid service ID');
        }

        await service.removeContractorService(contractorId, serviceId);
        ResponseHelpers.ok(res, { message: 'Service removed successfully' });
      } catch (error) {
        ErrorHelpers.internal(req, res, 'Failed to remove service', error);
      }
    });
  }

  return router;
}
