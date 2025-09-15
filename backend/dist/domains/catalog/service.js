"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
class CatalogService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getCatalogItems(query) {
        // Validate and sanitize query parameters
        const sanitizedQuery = {
            ...query,
            limit: Math.min(Math.max(query.limit || 50, 1), 200),
            offset: Math.max(query.offset || 0, 0),
            q: query.q?.trim() || undefined,
            category: query.category?.trim() || undefined,
        };
        return await this.repository.getCatalogItems(sanitizedQuery);
    }
    async getCategories() {
        return await this.repository.getCategories();
    }
    async getCategoriesTree() {
        return await this.repository.getCategoriesTree();
    }
    // Contractor-specific business logic
    async getContractorServices(contractorId) {
        if (!contractorId?.trim()) {
            throw new Error('Contractor ID is required');
        }
        return await this.repository.getContractorServices(contractorId);
    }
    async addContractorService(contractorId, serviceId) {
        if (!contractorId?.trim()) {
            throw new Error('Contractor ID is required');
        }
        if (!serviceId || serviceId <= 0) {
            throw new Error('Valid service ID is required');
        }
        await this.repository.addContractorService(contractorId, serviceId);
    }
    async updateContractorService(contractorId, serviceId, updates) {
        if (!contractorId?.trim()) {
            throw new Error('Contractor ID is required');
        }
        if (!serviceId || serviceId <= 0) {
            throw new Error('Valid service ID is required');
        }
        // Validate pricing if provided
        if (updates.contractor_price !== undefined && updates.contractor_price < 0) {
            throw new Error('Contractor price must be non-negative');
        }
        // Validate lead time if provided
        if (updates.lead_time_hours !== undefined && updates.lead_time_hours < 0) {
            throw new Error('Lead time must be non-negative');
        }
        await this.repository.updateContractorService(contractorId, serviceId, updates);
    }
    async removeContractorService(contractorId, serviceId) {
        if (!contractorId?.trim()) {
            throw new Error('Contractor ID is required');
        }
        if (!serviceId || serviceId <= 0) {
            throw new Error('Valid service ID is required');
        }
        await this.repository.removeContractorService(contractorId, serviceId);
    }
    // Search and filtering helpers
    async searchCatalog(searchTerm, options) {
        return await this.getCatalogItems({
            q: searchTerm,
            type: options?.type,
            category: options?.category,
            limit: options?.limit || 50,
            active: true, // Only show active items in search
        });
    }
    async getCatalogByCategory(category, options) {
        return await this.getCatalogItems({
            category,
            type: options?.type,
            limit: options?.limit || 50,
            active: true, // Only show active items by default
        });
    }
    async getCatalogByType(type, options) {
        return await this.getCatalogItems({
            type,
            category: options?.category,
            limit: options?.limit || 50,
            active: true, // Only show active items by default
        });
    }
}
exports.CatalogService = CatalogService;
//# sourceMappingURL=service.js.map