import type { CatalogFilters, CatalogListResult } from './types';
import { fetchCatalogItems } from './store';

export async function getCatalogItems(filters: CatalogFilters): Promise<CatalogListResult> {
  return fetchCatalogItems(filters);
}
