/**
 * File: service.ts
 *
 * Description: Catalog domain business logic layer
 * Function: Business operations and validation for catalog features
 * Importance: Centralized business logic with proper validation
 * Connects to: Repository layer, validation rules
 */
import { CatalogRepository } from './repository';
import { CatalogItem, CatalogListQuery, CatalogCategory, OrgService } from './types';
export declare class CatalogService {
    private repository;
    constructor(repository: CatalogRepository);
    getCatalogItems(query: CatalogListQuery): Promise<CatalogItem[]>;
    getCategories(): Promise<string[]>;
    getCategoriesTree(): Promise<CatalogCategory[]>;
    getContractorServices(contractorId: string): Promise<OrgService[]>;
    addContractorService(contractorId: string, serviceId: number): Promise<void>;
    updateContractorService(contractorId: string, serviceId: number, updates: Partial<Pick<OrgService, 'contractor_price' | 'is_available' | 'lead_time_hours' | 'notes'>>): Promise<void>;
    removeContractorService(contractorId: string, serviceId: number): Promise<void>;
    searchCatalog(searchTerm: string, options?: {
        type?: 'service' | 'product';
        category?: string;
        limit?: number;
    }): Promise<CatalogItem[]>;
    getCatalogByCategory(category: string, options?: {
        type?: 'service' | 'product';
        limit?: number;
    }): Promise<CatalogItem[]>;
    getCatalogByType(type: 'service' | 'product', options?: {
        category?: string;
        limit?: number;
    }): Promise<CatalogItem[]>;
}
//# sourceMappingURL=service.d.ts.map