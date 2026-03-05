import type { CatalogFilters, CatalogListResult, CatalogViewerContext } from './types';
import { fetchCatalogItems } from './store';

export async function getCatalogItems(
  filters: CatalogFilters,
  viewer: CatalogViewerContext,
): Promise<CatalogListResult> {
  return fetchCatalogItems(filters, viewer);
}
