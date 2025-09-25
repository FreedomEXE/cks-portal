import { query } from '../../db/connection';
import type {
  CatalogFilters,
  CatalogItem,
  CatalogItemPrice,
  CatalogListResult,
  CatalogPage,
  CatalogProductDetails,
  CatalogServiceDetails,
} from './types';

interface CatalogItemRow {
  item_code: string;
  name: string;
  item_type: 'product' | 'service';
  description: string | null;
  image_url: string | null;
  tags: string[] | null;
  unit_of_measure: string | null;
  base_price: string | number | null;
  currency: string | null;
  metadata: Record<string, unknown> | null;
  sku: string | null;
  package_size: string | null;
  lead_time_days: number | null;
  reorder_point: number | null;
  product_attributes: Record<string, unknown> | null;
  duration_minutes: number | null;
  service_window: string | null;
  service_attributes: Record<string, unknown> | null;
}

function toPrice(row: CatalogItemRow): CatalogItemPrice | null {
  if (row.base_price === null || row.base_price === undefined) {
    return null;
  }
  const amount = typeof row.base_price === 'string' ? row.base_price : row.base_price.toFixed(2);
  const currency = row.currency ?? 'USD';
  return {
    amount,
    currency,
    unitOfMeasure: row.unit_of_measure ?? null,
  };
}

function toProductDetails(row: CatalogItemRow): CatalogProductDetails | null {
  if (row.item_type !== 'product') {
    return null;
  }
  return {
    sku: row.sku ?? null,
    packageSize: row.package_size ?? null,
    leadTimeDays: row.lead_time_days ?? null,
    reorderPoint: row.reorder_point ?? null,
    attributes: row.product_attributes ?? null,
  };
}

function toServiceDetails(row: CatalogItemRow): CatalogServiceDetails | null {
  if (row.item_type !== 'service') {
    return null;
  }
  return {
    durationMinutes: row.duration_minutes ?? null,
    serviceWindow: row.service_window ?? null,
    attributes: row.service_attributes ?? null,
  };
}

function mapCatalogRow(row: CatalogItemRow): CatalogItem {
  const tags = Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  return {
    code: row.item_code,
    name: row.name,
    type: row.item_type,
    description: row.description ?? null,
    tags,
    imageUrl: row.image_url ?? null,
    unitOfMeasure: row.unit_of_measure ?? null,
    price: toPrice(row),
    metadata: row.metadata ?? null,
    product: toProductDetails(row),
    service: toServiceDetails(row),
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }
  const numeric = Math.floor(Number(limit));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 20;
  }
  return Math.min(numeric, 50);
}

function normalizeOffset(offset: number | undefined): number {
  if (!Number.isFinite(offset)) {
    return 0;
  }
  const numeric = Math.floor(Number(offset));
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }
  return numeric;
}

function buildWhere(filters: CatalogFilters) {
  const where: string[] = ['i.is_active = TRUE'];
  const params: unknown[] = [];

  if (filters.type) {
    params.push(filters.type);
    where.push(`i.item_type = $${params.length}`);
  }

  if (filters.search) {
    const trimmed = filters.search.trim();
    if (trimmed.length > 0) {
      const searchValue = `%${trimmed.replace(/%+/g, '%')}%`;
      params.push(searchValue);
      const placeholder = `$${params.length}`;
      where.push(`(i.name ILIKE ${placeholder} OR i.description ILIKE ${placeholder} OR EXISTS (
        SELECT 1 FROM UNNEST(i.tags) AS tag WHERE tag ILIKE ${placeholder}
      ))`);
    }
  }

  if (filters.tags && filters.tags.length > 0) {
    const normalizedTags = filters.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
    if (normalizedTags.length > 0) {
      params.push(normalizedTags);
      where.push(`i.tags && $${params.length}::text[]`);
    }
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { clause, params };
}

export async function fetchCatalogItems(filters: CatalogFilters): Promise<CatalogListResult> {
  const limit = normalizeLimit(filters.limit);
  const offset = normalizeOffset(filters.offset);
  const { clause, params } = buildWhere(filters);

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM catalog_items i
     ${clause}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? '0', 10) || 0;

  const limitPosition = params.length + 1;
  const offsetPosition = params.length + 2;
  const queryParams = [...params, limit, offset];

  const rowsResult = await query<CatalogItemRow>(
    `SELECT
        i.item_code,
        i.name,
        i.item_type,
        i.description,
        i.image_url,
        i.tags,
        i.unit_of_measure,
        i.base_price,
        i.currency,
        i.metadata,
        pd.sku,
        pd.package_size,
        pd.lead_time_days,
        pd.reorder_point,
        pd.attributes AS product_attributes,
        sd.duration_minutes,
        sd.service_window,
        sd.attributes AS service_attributes
     FROM catalog_items AS i
     LEFT JOIN catalog_product_details AS pd ON pd.item_id = i.id
     LEFT JOIN catalog_service_details AS sd ON sd.item_id = i.id
     ${clause}
     ORDER BY i.name ASC
     LIMIT $${limitPosition}
     OFFSET $${offsetPosition}`,
    queryParams,
  );

  const items = rowsResult.rows.map(mapCatalogRow);
  const page: CatalogPage = {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };

  return { items, page };
}
