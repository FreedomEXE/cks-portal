"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCatalogRouter = createCatalogRouter;
/**
 * File: routes.factory.ts
 *
 * Description: Catalog domain route factory
 * Function: Creates role-specific catalog routers with configuration
 * Importance: Enables role-based catalog features while sharing logic
 * Connects to: Role configurations, catalog service, auth middleware
 */
const express_1 = require("express");
const service_1 = require("./service");
const repository_1 = require("./repository");
const requireCaps_1 = require("../../core/auth/requireCaps");
const responses_1 = require("../../core/http/responses");
const errors_1 = require("../../core/http/errors");
const connection_1 = __importDefault(require("../../db/connection"));
function createCatalogRouter(config) {
    const router = (0, express_1.Router)();
    const repository = new repository_1.CatalogRepository(connection_1.default);
    const service = new service_1.CatalogService(repository);
    // GET /items - Browse catalog items (services and products)
    if (config.features.browse) {
        router.get('/items', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const query = {
                    q: req.query.q,
                    category: req.query.category,
                    type: req.query.type,
                    active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
                    limit: parseInt(req.query.limit) || undefined,
                    offset: parseInt(req.query.offset) || undefined,
                };
                const items = await service.getCatalogItems(query);
                responses_1.ResponseHelpers.ok(res, items);
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to fetch catalog items', error);
            }
        });
    }
    // GET /categories - Get available categories
    if (config.features.categories) {
        router.get('/categories', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const categories = await service.getCategories();
                responses_1.ResponseHelpers.ok(res, categories);
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to fetch categories', error);
            }
        });
        // GET /categories/tree - Get hierarchical categories
        router.get('/categories/tree', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const tree = await service.getCategoriesTree();
                responses_1.ResponseHelpers.ok(res, tree);
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to fetch category tree', error);
            }
        });
    }
    // GET /search - Search catalog (convenience endpoint)
    if (config.features.search) {
        router.get('/search', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const searchTerm = req.query.q;
                if (!searchTerm?.trim()) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Search term required');
                }
                const options = {
                    type: req.query.type,
                    category: req.query.category,
                    limit: parseInt(req.query.limit) || undefined,
                };
                const items = await service.searchCatalog(searchTerm, options);
                responses_1.ResponseHelpers.ok(res, items);
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Search failed', error);
            }
        });
    }
    // Contractor-specific "My Services" routes
    if (config.features.myServices) {
        // GET /my-services - Get contractor's services
        router.get('/my-services', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const contractorId = req.headers['x-entity-id'];
                if (!contractorId) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Contractor context missing');
                }
                const services = await service.getContractorServices(contractorId);
                responses_1.ResponseHelpers.ok(res, services);
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to fetch contractor services', error);
            }
        });
        // POST /my-services/add - Add service to contractor's offerings
        router.post('/my-services/add', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const contractorId = req.headers['x-entity-id'];
                const { service_id } = req.body;
                if (!contractorId) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Contractor context missing');
                }
                if (!service_id) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Service ID required');
                }
                await service.addContractorService(contractorId, parseInt(service_id));
                responses_1.ResponseHelpers.ok(res, { message: 'Service added successfully' });
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to add service', error);
            }
        });
        // PUT /my-services/:serviceId - Update contractor service settings
        router.put('/my-services/:serviceId', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const contractorId = req.headers['x-entity-id'];
                const serviceId = parseInt(req.params.serviceId);
                const updates = req.body;
                if (!contractorId) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Contractor context missing');
                }
                if (isNaN(serviceId)) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Invalid service ID');
                }
                await service.updateContractorService(contractorId, serviceId, updates);
                responses_1.ResponseHelpers.ok(res, { message: 'Service updated successfully' });
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to update service', error);
            }
        });
        // DELETE /my-services/:serviceId - Remove service from contractor's offerings
        router.delete('/my-services/:serviceId', (0, requireCaps_1.requireCaps)(config.capabilities.view), async (req, res) => {
            try {
                const contractorId = req.headers['x-entity-id'];
                const serviceId = parseInt(req.params.serviceId);
                if (!contractorId) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Contractor context missing');
                }
                if (isNaN(serviceId)) {
                    return errors_1.ErrorHelpers.badRequest(req, res, 'Invalid service ID');
                }
                await service.removeContractorService(contractorId, serviceId);
                responses_1.ResponseHelpers.ok(res, { message: 'Service removed successfully' });
            }
            catch (error) {
                errors_1.ErrorHelpers.internal(req, res, 'Failed to remove service', error);
            }
        });
    }
    return router;
}
//# sourceMappingURL=routes.factory.js.map