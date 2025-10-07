import { query } from "../../db/connection";
import type {
  CatalogFilters,
  CatalogItem,
  CatalogItemPrice,
  CatalogListResult,
  CatalogPage,
  CatalogProductDetails,
  CatalogServiceDetails,
} from "./types";

interface CatalogItemRow {
  item_code: string;
  name: string;
  item_type: "product" | "service";
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
  category: string | null;
  crew_required: number | null;
  managed_by: string | null;
  is_active: boolean | null;
  stock_available: number | null;
  stock_on_hand: number | null;
}

function toPrice(row: CatalogItemRow): CatalogItemPrice | null {
  if (row.base_price === null || row.base_price === undefined) {
    return null;
  }
  const numericAmount = typeof row.base_price === "string" ? Number(row.base_price) : row.base_price;
  const amount = Number.isFinite(numericAmount) ? numericAmount.toFixed(2) : String(row.base_price);
  const currency = row.currency ?? "USD";
  return {
    amount,
    currency,
    unitOfMeasure: row.unit_of_measure ?? null,
  };
}

function toProductDetails(row: CatalogItemRow): CatalogProductDetails | null {
  if (row.item_type !== "product") {
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
  if (row.item_type !== "service") {
    return null;
  }
  return {
    durationMinutes: row.duration_minutes ?? null,
    serviceWindow: row.service_window ?? null,
    attributes: row.service_attributes ?? null,
  };
}

function mapCatalogRow(row: CatalogItemRow): CatalogItem {
  const tags = Array.isArray(row.tags)
    ? row.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (row.category && !tags.includes(row.category)) {
    tags.unshift(row.category);
  }

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
    managedBy: row.managed_by ?? null,
    stockAvailable: row.stock_available ?? null,
    stockOnHand: row.stock_on_hand ?? null,
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
  const where: string[] = ["i.is_active = TRUE"];
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

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return { clause, params };
}

const CATALOG_UNION = `
  SELECT
    p.product_id AS item_code,
    p.name,
    'product'::text AS item_type,
    p.description,
    p.image_url,
    p.tags,
    p.unit_of_measure,
    p.base_price,
    p.currency,
    p.metadata,
    p.sku,
    p.package_size,
    p.lead_time_days,
    p.reorder_point,
    p.attributes AS product_attributes,
    NULL::integer AS duration_minutes,
    NULL::text AS service_window,
    NULL::jsonb AS service_attributes,
    p.category,
    NULL::integer AS crew_required,
    NULL::text AS managed_by,
    p.is_active,
    COALESCE(inv.total_available, 0) AS stock_available,
    COALESCE(inv.total_on_hand, 0) AS stock_on_hand
  FROM catalog_products AS p
  LEFT JOIN (
    SELECT
      item_id,
      SUM(quantity_available) AS total_available,
      SUM(quantity_on_hand) AS total_on_hand
    FROM inventory_items
    WHERE status = 'active' AND archived_at IS NULL
    GROUP BY item_id
  ) inv ON p.product_id = inv.item_id
  WHERE p.is_active = TRUE AND inv.total_on_hand IS NOT NULL AND inv.total_on_hand > 0
  UNION ALL
  SELECT
    s.service_id AS item_code,
    s.name,
    'service'::text AS item_type,
    s.description,
    s.image_url,
    s.tags,
    s.unit_of_measure,
    s.base_price,
    s.currency,
    s.metadata,
    NULL::text AS sku,
    NULL::text AS package_size,
    NULL::integer AS lead_time_days,
    NULL::integer AS reorder_point,
    NULL::jsonb AS product_attributes,
    s.duration_minutes,
    s.service_window,
    s.attributes AS service_attributes,
    s.category,
    s.crew_required,
    s.managed_by,
    s.is_active,
    NULL::integer AS stock_available,
    NULL::integer AS stock_on_hand
  FROM catalog_services AS s
  WHERE s.is_active = TRUE
`;

export async function fetchCatalogItems(filters: CatalogFilters): Promise<CatalogListResult> {
  const limit = normalizeLimit(filters.limit);
  const offset = normalizeOffset(filters.offset);
  const { clause, params } = buildWhere(filters);

  const countResult = await query<{ count: string }>(
    `WITH catalog_union AS (${CATALOG_UNION})
     SELECT COUNT(*)::text AS count
     FROM catalog_union i
     ${clause}`,
    params,
  );
  const total = Number.parseInt(countResult.rows[0]?.count ?? "0", 10) || 0;

  const limitPosition = params.length + 1;
  const offsetPosition = params.length + 2;
  const queryParams = [...params, limit, offset];

  const rowsResult = await query<CatalogItemRow>(
    `WITH catalog_union AS (${CATALOG_UNION})
     SELECT
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
       i.sku,
       i.package_size,
       i.lead_time_days,
       i.reorder_point,
       i.product_attributes,
       i.duration_minutes,
       i.service_window,
       i.service_attributes,
       i.category,
       i.crew_required,
       i.managed_by,
       i.is_active,
       i.stock_available,
       i.stock_on_hand
     FROM catalog_union AS i
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
