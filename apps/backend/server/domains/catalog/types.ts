export type CatalogItemType = 'product' | 'service';

export interface CatalogItemPrice {
  amount: string;
  currency: string;
  unitOfMeasure: string | null;
}

export interface CatalogProductDetails {
  sku: string | null;
  packageSize: string | null;
  leadTimeDays: number | null;
  reorderPoint: number | null;
  attributes: Record<string, unknown> | null;
}

export interface CatalogServiceDetails {
  durationMinutes: number | null;
  serviceWindow: string | null;
  attributes: Record<string, unknown> | null;
}

export interface CatalogItem {
  code: string;
  name: string;
  type: CatalogItemType;
  description: string | null;
  tags: string[];
  imageUrl: string | null;
  unitOfMeasure: string | null;
  price: CatalogItemPrice | null;
  metadata: Record<string, unknown> | null;
  product?: CatalogProductDetails | null;
  service?: CatalogServiceDetails | null;
  stockAvailable?: number | null;
  stockOnHand?: number | null;
}

export interface CatalogFilters {
  type?: CatalogItemType;
  search?: string | null;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface CatalogPage {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CatalogListResult {
  items: CatalogItem[];
  page: CatalogPage;
}
