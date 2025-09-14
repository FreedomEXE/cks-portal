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
 * Connects to: Role configurations, catalog service, capability middleware
 */

import { Router } from 'express';
import { CatalogService } from './service';
import { CatalogRepository } from './repository';
import { CatalogRouteConfig } from './types';
import pool from '../../../../Database/db/pool';

export function createCatalogRouter(config: CatalogRouteConfig): Router {
  const router = Router();
  const repository = new CatalogRepository(pool);
  const service = new CatalogService(repository);

  // Simple capability check function (temporary until proper caps system)
  const requireCaps = (requiredCaps: string[]) => {
    return (req: any, res: any, next: any) => {
      // For now, we'll do basic role-based access
      // TODO: Implement proper capability checking
      const userRole = req.user?.role || req.headers['x-role'];

      if (config.role === 'global') {
        // Global access - allow all authenticated users
        return next();
      }

      if (config.role === 'admin' && userRole === 'admin') {
        return next();
      }

      if (config.role === 'manager' && (userRole === 'manager' || userRole === 'admin')) {
        return next();
      }

      if (config.role === 'contractor' && userRole === 'contractor') {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        required: requiredCaps,
        role: config.role
      });
    };
  };

  // GET /items - Browse catalog items (services and products)
  if (config.features.browse) {
    router.get('/items', requireCaps(['catalog:view']), async (req, res) => {
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
        res.json({ success: true, data: items });
      } catch (error: any) {
        console.error('Catalog items error:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to fetch catalog items',
          error_code: 'server_error'
        });
      }
    });
  }

  // GET /categories - Get available categories
  if (config.features.categories) {
    router.get('/categories', requireCaps(['catalog:view']), async (req, res) => {
      try {
        const categories = await service.getCategories();
        res.json({ success: true, data: categories });
      } catch (error: any) {
        console.error('Categories error:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to fetch categories',
          error_code: 'server_error'
        });
      }
    });

  }

  // GET /search - Search catalog (convenience endpoint)
  if (config.features.search) {
    router.get('/search', requireCaps(['catalog:view']), async (req, res) => {
      try {
        const searchTerm = req.query.q as string;
        if (!searchTerm?.trim()) {
          return res.status(400).json({
            success: false,
            error: 'Search term is required',
            error_code: 'validation_error'
          });
        }

        const options = {
          type: req.query.type as 'service' | 'product' | undefined,
          category: req.query.category as string | undefined,
          limit: parseInt(req.query.limit as string) || undefined,
        };

        const items = await service.searchCatalog(searchTerm, options);
        res.json({ success: true, data: items });
      } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({
          success: false,
          error: error.message || 'Search failed',
          error_code: 'server_error'
        });
      }
    });
  }

  // TODO: Contractor-specific "My Services" routes (requires org_services table)

  return router;
}