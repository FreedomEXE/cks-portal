import { query } from "../../db/connection";
import { normalizeIdentity } from "../identity";
import type {
  CatalogFilters,
  CatalogItem,
  CatalogItemPrice,
  CatalogListResult,
  CatalogPage,
  CatalogProductDetails,
  CatalogServiceDetails,
  CatalogViewerContext,
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

export function normalizeCategorySlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized : null;
}

export function canonicalizeCatalogCategory(
  itemType: "product" | "service",
  category: unknown,
  itemCode?: string | null,
): string | null {
  if (itemType === "service" && typeof itemCode === "string" && itemCode.trim().toUpperCase() === "SRV-001") {
    return "daily";
  }

  const normalized = normalizeCategorySlug(category);
  if (!normalized) {
    return null;
  }

  if (itemType === "product" && (normalized === "garbage-bags-clear" || normalized === "garbage-bags")) {
    return "garbage-bags";
  }

  return normalized;
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
  const canonicalCategory = canonicalizeCatalogCategory(row.item_type, row.category, row.item_code);
  const tags = Array.isArray(row.tags)
    ? row.tags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (canonicalCategory && !tags.includes(canonicalCategory)) {
    tags.unshift(canonicalCategory);
  }

  return {
    code: row.item_code,
    name: row.name,
    type: row.item_type,
    category: canonicalCategory,
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

export async function resolveCatalogEcosystemManagerId(
  viewer: Pick<CatalogViewerContext, "role" | "cksCode" | "isAdmin">,
): Promise<string | null> {
  if (viewer.isAdmin) {
    return null;
  }

  const normalizedCode = normalizeIdentity(viewer.cksCode);
  const normalizedRole = (viewer.role || "").trim().toLowerCase();
  if (!normalizedCode || !normalizedRole) {
    return null;
  }

  switch (normalizedRole) {
    case "manager":
      return normalizedCode;
    case "center": {
      const result = await query<{ cks_manager: string | null }>(
        "SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1) LIMIT 1",
        [normalizedCode],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case "customer": {
      const result = await query<{ cks_manager: string | null }>(
        "SELECT cks_manager FROM customers WHERE UPPER(customer_id) = UPPER($1) LIMIT 1",
        [normalizedCode],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case "contractor": {
      const result = await query<{ cks_manager: string | null }>(
        "SELECT cks_manager FROM contractors WHERE UPPER(contractor_id) = UPPER($1) LIMIT 1",
        [normalizedCode],
      );
      return normalizeIdentity(result.rows[0]?.cks_manager ?? null);
    }
    case "crew": {
      const result = await query<{ assigned_center: string | null }>(
        "SELECT assigned_center FROM crew WHERE UPPER(crew_id) = UPPER($1) LIMIT 1",
        [normalizedCode],
      );
      const assignedCenter = normalizeIdentity(result.rows[0]?.assigned_center ?? null);
      if (!assignedCenter) {
        return null;
      }
      const centerResult = await query<{ cks_manager: string | null }>(
        "SELECT cks_manager FROM centers WHERE UPPER(center_id) = UPPER($1) LIMIT 1",
        [assignedCenter],
      );
      return normalizeIdentity(centerResult.rows[0]?.cks_manager ?? null);
    }
    case "warehouse":
      // Warehouses see the full catalog regardless of ecosystem visibility rules
      return null;
    default:
      return null;
  }
}

export async function isCatalogItemVisible(
  viewer: CatalogViewerContext,
  itemType: "product" | "service",
  itemCode: string,
): Promise<boolean> {
  if (viewer.isAdmin) {
    return true;
  }

  const ecosystemManagerId = await resolveCatalogEcosystemManagerId(viewer);
  if (!ecosystemManagerId) {
    return true;
  }

  const result = await query<{ visibility_mode: string | null; is_listed: boolean }>(
    `WITH policy AS (
       SELECT visibility_mode
       FROM catalog_ecosystem_visibility_policies
       WHERE UPPER(ecosystem_manager_id) = UPPER($1)
         AND item_type = $2
       LIMIT 1
     ),
     listed AS (
       SELECT EXISTS (
         SELECT 1
         FROM catalog_ecosystem_visibility_items
         WHERE UPPER(ecosystem_manager_id) = UPPER($1)
           AND item_type = $2
           AND UPPER(item_code) = UPPER($3)
       ) AS is_listed
     )
     SELECT
       (SELECT visibility_mode FROM policy) AS visibility_mode,
       (SELECT is_listed FROM listed) AS is_listed`,
    [ecosystemManagerId, itemType, itemCode],
  );

  const row = result.rows[0];
  const mode = (row?.visibility_mode ?? "all").toLowerCase();
  return mode !== "allowlist" || Boolean(row?.is_listed);
}

function buildWhere(filters: CatalogFilters, ecosystemManagerId: string | null) {
  const where: string[] = ["i.is_active = TRUE"];
  const params: unknown[] = [];

  const categorySlugSql = `NULLIF(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        LOWER(COALESCE(i.category, '')),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '(^-+|-+$)',
      '',
      'g'
    ),
    ''
  )`;
  const canonicalCategorySql = `(
    CASE
      WHEN i.item_type = 'service' AND UPPER(i.item_code) = 'SRV-001' THEN 'daily'
      WHEN ${categorySlugSql} IN ('garbage-bags', 'garbage-bags-clear') THEN 'garbage-bags'
      ELSE ${categorySlugSql}
    END
  )`;

  if (filters.type) {
    params.push(filters.type);
    where.push(`i.item_type = $${params.length}`);
  }

  if (filters.category) {
    const rawCategory = normalizeCategorySlug(filters.category);
    const normalizedCategory =
      rawCategory === "garbage-bags-clear" || rawCategory === "garbage-bags"
        ? "garbage-bags"
        : rawCategory;
    if (normalizedCategory) {
      params.push(normalizedCategory);
      where.push(`${canonicalCategorySql} = $${params.length}`);
    }
  }

  if (filters.search) {
    const trimmed = filters.search.trim();
    if (trimmed.length > 0) {
      const searchValue = `%${trimmed.replace(/%+/g, '%')}%`;
      params.push(searchValue);
      const placeholder = `$${params.length}`;
      where.push(`(i.name ILIKE ${placeholder} OR i.description ILIKE ${placeholder} OR i.item_code ILIKE ${placeholder} OR EXISTS (
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

  if (filters.isTest === true) {
    params.push('%-TEST%');
    where.push(`i.item_code ILIKE $${params.length}`);
  } else if (filters.isTest === false) {
    params.push('%-TEST%');
    where.push(`i.item_code NOT ILIKE $${params.length}`);
  }

  if (ecosystemManagerId) {
    params.push(ecosystemManagerId);
    const ecosystemParam = `$${params.length}`;
    where.push(`(
      NOT EXISTS (
        SELECT 1
        FROM catalog_ecosystem_visibility_policies p
        WHERE UPPER(p.ecosystem_manager_id) = UPPER(${ecosystemParam})
          AND p.item_type = i.item_type
          AND p.visibility_mode = 'allowlist'
      )
      OR EXISTS (
        SELECT 1
        FROM catalog_ecosystem_visibility_items vi
        WHERE UPPER(vi.ecosystem_manager_id) = UPPER(${ecosystemParam})
          AND vi.item_type = i.item_type
          AND UPPER(vi.item_code) = UPPER(i.item_code)
      )
    )`);
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
    COALESCE(
      NULLIF(BTRIM(p.category), ''),
      NULLIF(BTRIM(p.metadata->>'category'), '')
    ) AS category,
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
  WHERE p.is_active = TRUE
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
    COALESCE(
      NULLIF(BTRIM(s.category), ''),
      NULLIF(BTRIM(s.metadata->>'category'), '')
    ) AS category,
    s.crew_required,
    s.managed_by,
    s.is_active,
    NULL::integer AS stock_available,
    NULL::integer AS stock_on_hand
  FROM catalog_services AS s
  WHERE s.is_active = TRUE
`;

export async function fetchCatalogItems(
  filters: CatalogFilters,
  viewer: CatalogViewerContext,
): Promise<CatalogListResult> {
  const limit = normalizeLimit(filters.limit);
  const offset = normalizeOffset(filters.offset);
  const ecosystemManagerId = viewer.isAdmin ? null : await resolveCatalogEcosystemManagerId(viewer);
  const { clause, params } = buildWhere(filters, ecosystemManagerId);

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
     ORDER BY
       CASE WHEN i.item_type = 'service' AND i.item_code = 'SRV-001' THEN 0 ELSE 1 END,
       i.name ASC
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
