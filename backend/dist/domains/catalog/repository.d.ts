/**
 * File: repository.ts
 *
 * Description: Catalog domain data access layer
 * Function: Database operations for catalog entities
 * Importance: Centralized data access with proper error handling
 * Connects to: Database connection pool, catalog tables
 */
import { Pool } from 'pg';
import { CatalogItem, CatalogListQuery, CatalogCategory, OrgService } from './types';
export declare class CatalogRepository {
    private db;
    constructor(db: Pool);
    getCatalogItems(query: CatalogListQuery): Promise<CatalogItem[]>;
    getCategories(): Promise<string[]>;
    getCategoriesTree(): Promise<CatalogCategory[]>;
    getContractorServices(contractorId: string): Promise<OrgService[]>;
    addContractorService(contractorId: string, serviceId: number): Promise<void>;
    updateContractorService(contractorId: string, serviceId: number, updates: Partial<Pick<OrgService, 'contractor_price' | 'is_available' | 'lead_time_hours' | 'notes'>>): Promise<void>;
    removeContractorService(contractorId: string, serviceId: number): Promise<void>;
}
//# sourceMappingURL=repository.d.ts.map