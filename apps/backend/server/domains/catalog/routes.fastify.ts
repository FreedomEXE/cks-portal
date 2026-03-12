import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { requireActiveAdmin } from '../adminUsers/guards';
import { query, withTransaction } from '../../db/connection';
import { getCatalogItems } from './service';
import { canonicalizeCatalogCategory, isCatalogItemVisible, resolveCatalogEcosystemManagerId } from './store';
import { recordActivity } from '../activity/writer';
import { uploadImageToCloudinary } from '../../shared/cloudinary';

const querySchema = z.object({
  type: z.enum(['product', 'service']).optional(),
  category: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(20),
});

function normalizeTags(input: unknown): string[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  if (typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  return [];
}

function normalizeCodes(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') {
      continue;
    }
    const value = raw.trim().toUpperCase();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

async function isManagerCertifiedForCatalogService(managerCode: string, serviceId: string): Promise<boolean> {
  const normalizedManagerCode = managerCode.trim().toUpperCase();
  const normalizedServiceId = serviceId.trim().toUpperCase();
  if (!normalizedManagerCode || !normalizedServiceId) {
    return false;
  }

  const result = await query<{ exists: number }>(
    `SELECT 1 AS exists
     FROM service_certifications
     WHERE UPPER(service_id) = UPPER($1)
       AND UPPER(user_id) = UPPER($2)
       AND role = 'manager'
       AND archived_at IS NULL
     LIMIT 1`,
    [normalizedServiceId, normalizedManagerCode],
  );
  return result.rowCount > 0;
}

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

type ServiceRequestMetadata = {
  requesterRole: 'manager' | 'warehouse';
  requesterId: string;
  requesterName?: string | null;
  ecosystemManagerId: string;
  managedBy: 'manager' | 'warehouse';
};

function parseServiceRequestMetadata(raw: unknown, fallbackManagerId: string): ServiceRequestMetadata {
  const metadata = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const requesterRole = String(metadata.requesterRole || 'manager').toLowerCase() === 'warehouse' ? 'warehouse' : 'manager';
  const requesterId = String(metadata.requesterId || fallbackManagerId).trim().toUpperCase();
  const ecosystemManagerId = String(metadata.ecosystemManagerId || fallbackManagerId).trim().toUpperCase();
  const requesterName = typeof metadata.requesterName === 'string' ? metadata.requesterName : null;
  const managedBy = String(metadata.managedBy || requesterRole).toLowerCase() === 'warehouse' ? 'warehouse' : 'manager';

  return {
    requesterRole,
    requesterId,
    requesterName,
    ecosystemManagerId: ecosystemManagerId || fallbackManagerId,
    managedBy,
  };
}

function buildServiceRequestApprovalStages(
  status: 'pending' | 'approved' | 'rejected',
  requesterRole: 'manager' | 'warehouse',
  requesterName?: string | null,
  requesterId?: string | null,
  reviewedBy?: string | null,
  requestedAt?: Date | string | null,
  reviewedAt?: Date | string | null,
) {
  const requestRoleLabel = requesterRole === 'warehouse' ? 'warehouse' : 'manager';
  const requestStage = {
    role: requestRoleLabel,
    status: 'requested',
    label: 'Requested',
    user: requesterName || requesterId || undefined,
    timestamp: requestedAt ? String(requestedAt) : undefined,
  };

  if (status === 'approved') {
    return [
      requestStage,
      {
        role: 'admin',
        status: 'approved',
        label: 'Accepted',
        user: reviewedBy || undefined,
        timestamp: reviewedAt ? String(reviewedAt) : undefined,
      },
    ];
  }

  if (status === 'rejected') {
    return [
      requestStage,
      {
        role: 'admin',
        status: 'rejected',
        label: 'Rejected',
        user: reviewedBy || undefined,
        timestamp: reviewedAt ? String(reviewedAt) : undefined,
      },
    ];
  }

  return [
    requestStage,
    {
      role: 'admin',
      status: 'pending',
      label: 'Pending',
    },
  ];
}

async function resolveWarehouseContext(
  warehouseId: string,
): Promise<{ managerId: string | null; warehouseName: string | null }> {
  const normalizedWarehouseId = warehouseId.trim().toUpperCase();
  if (!normalizedWarehouseId) {
    return { managerId: null, warehouseName: null };
  }

  const byManagerId = await query<{ manager_id: string | null; name: string | null }>(
    `SELECT manager_id, name
     FROM warehouses
     WHERE UPPER(warehouse_id) = UPPER($1)
     LIMIT 1`,
    [normalizedWarehouseId],
  );
  if (byManagerId.rowCount > 0) {
    const row = byManagerId.rows[0];
    const managerId = row.manager_id?.trim().toUpperCase() || null;
    if (managerId) {
      return { managerId, warehouseName: row.name ?? null };
    }
  }

  try {
    const legacy = await query<{ cks_manager: string | null; name: string | null }>(
      `SELECT cks_manager, name
       FROM warehouses
       WHERE UPPER(warehouse_id) = UPPER($1)
       LIMIT 1`,
      [normalizedWarehouseId],
    );
    if (legacy.rowCount > 0) {
      const row = legacy.rows[0];
      const managerId = row.cks_manager?.trim().toUpperCase() || null;
      if (managerId) {
        return { managerId, warehouseName: row.name ?? null };
      }
    }
  } catch {
    // Legacy cks_manager column is optional across environments; ignore query failure.
  }

  try {
    const fallback = await query<{ manager_id: string | null }>(
      `SELECT manager_id
       FROM orders
       WHERE UPPER(assigned_warehouse) = UPPER($1)
         AND manager_id IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedWarehouseId],
    );
    if (fallback.rowCount > 0) {
      return {
        managerId: fallback.rows[0].manager_id?.trim().toUpperCase() || null,
        warehouseName: byManagerId.rows[0]?.name ?? null,
      };
    }
  } catch {
    // orders table fallback is best-effort only.
  }

  return { managerId: null, warehouseName: null };
}

type CatalogEcosystemOption = {
  ecosystemId: string;
  ecosystemName: string | null;
};

async function listCatalogManagerEcosystems(): Promise<CatalogEcosystemOption[]> {
  const result = await query<{ ecosystem_id: string; ecosystem_name: string | null }>(
    `SELECT manager_id AS ecosystem_id, name AS ecosystem_name
     FROM managers
     WHERE LOWER(COALESCE(status, 'active')) <> 'archived'
     ORDER BY name ASC`,
    [],
  );
  return result.rows.map((row) => ({
    ecosystemId: row.ecosystem_id,
    ecosystemName: row.ecosystem_name,
  }));
}

async function collectWarehouseEcosystemIds(warehouseId: string): Promise<string[]> {
  const normalizedWarehouseId = warehouseId.trim().toUpperCase();
  if (!normalizedWarehouseId) {
    return [];
  }

  const ecosystemIds = new Set<string>();
  const context = await resolveWarehouseContext(normalizedWarehouseId);
  if (context.managerId) {
    ecosystemIds.add(context.managerId);
  }

  const byManagerId = await query<{ manager_id: string | null }>(
    `SELECT manager_id
     FROM warehouses
     WHERE UPPER(warehouse_id) = UPPER($1)
       AND manager_id IS NOT NULL
     LIMIT 1`,
    [normalizedWarehouseId],
  );
  if (byManagerId.rowCount > 0) {
    const managerId = byManagerId.rows[0].manager_id?.trim().toUpperCase();
    if (managerId) {
      ecosystemIds.add(managerId);
    }
  }

  try {
    const byLegacyManagerId = await query<{ cks_manager: string | null }>(
      `SELECT cks_manager
       FROM warehouses
       WHERE UPPER(warehouse_id) = UPPER($1)
         AND cks_manager IS NOT NULL
       LIMIT 1`,
      [normalizedWarehouseId],
    );
    if (byLegacyManagerId.rowCount > 0) {
      const managerId = byLegacyManagerId.rows[0].cks_manager?.trim().toUpperCase();
      if (managerId) {
        ecosystemIds.add(managerId);
      }
    }
  } catch {
    // Legacy cks_manager column is optional across environments; ignore query failure.
  }

  try {
    const fromOrders = await query<{ manager_id: string | null }>(
      `SELECT DISTINCT manager_id
       FROM orders
       WHERE UPPER(assigned_warehouse) = UPPER($1)
         AND manager_id IS NOT NULL`,
      [normalizedWarehouseId],
    );
    for (const row of fromOrders.rows) {
      const managerId = row.manager_id?.trim().toUpperCase();
      if (managerId) {
        ecosystemIds.add(managerId);
      }
    }
  } catch {
    // orders table fallback is best-effort only.
  }

  return Array.from(ecosystemIds);
}

async function isWarehouseEcosystemAllowed(warehouseId: string, ecosystemManagerId: string): Promise<boolean> {
  const normalizedEcosystemManagerId = ecosystemManagerId.trim().toUpperCase();
  if (!normalizedEcosystemManagerId) {
    return false;
  }
  const ecosystemIds = await collectWarehouseEcosystemIds(warehouseId);
  return ecosystemIds.includes(normalizedEcosystemManagerId);
}

async function ensureEcosystemAllowlistItem(
  itemType: 'product' | 'service',
  itemCode: string,
  ecosystemManagerId: string | null | undefined,
  actorId: string,
  txQuery?: typeof query,
): Promise<void> {
  const managerId = (ecosystemManagerId || '').trim().toUpperCase();
  const normalizedItemCode = itemCode.trim().toUpperCase();
  if (!managerId || !normalizedItemCode) {
    return;
  }

  const queryFn = txQuery ?? query;
  const policyResult = await queryFn<{ visibility_mode: 'all' | 'allowlist' }>(
    `SELECT visibility_mode
     FROM catalog_ecosystem_visibility_policies
     WHERE UPPER(ecosystem_manager_id) = UPPER($1)
       AND item_type = $2
     LIMIT 1`,
    [managerId, itemType],
  );

  const mode = (policyResult.rows[0]?.visibility_mode ?? 'all').toLowerCase();
  if (mode !== 'allowlist') {
    return;
  }

  await queryFn(
    `INSERT INTO catalog_ecosystem_visibility_items (
       ecosystem_manager_id,
       item_type,
       item_code,
       created_by
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING`,
    [managerId, itemType, normalizedItemCode, actorId],
  );
}

async function ensureAllowlistItemForAllEcosystems(
  itemType: 'product' | 'service',
  itemCode: string,
  actorId: string,
  txQuery?: typeof query,
): Promise<void> {
  const normalizedItemCode = itemCode.trim().toUpperCase();
  if (!normalizedItemCode) {
    return;
  }

  const queryFn = txQuery ?? query;
  await queryFn(
    `INSERT INTO catalog_ecosystem_visibility_items (
       ecosystem_manager_id,
       item_type,
       item_code,
       created_by
     )
     SELECT p.ecosystem_manager_id, p.item_type, $2, $3
     FROM catalog_ecosystem_visibility_policies p
     WHERE p.item_type = $1
       AND p.visibility_mode = 'allowlist'
     ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING`,
    [itemType, normalizedItemCode, actorId],
  );
}

export async function registerCatalogRoutes(server: FastifyInstance) {
  server.get('/api/catalog/items', async (request, reply) => {
    const auth = await requireActiveRole(request, reply);
    if (!auth) {
      return;
    }

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid query parameters' });
      return;
    }

    const { type, category, q, tags, page, pageSize } = parsed.data;
    const normalizedTags = normalizeTags(tags);
    const isTest = Boolean(auth.cksCode && auth.cksCode.toUpperCase().includes('-TEST'));
    const filters = {
      type: type ?? undefined,
      category: category ?? undefined,
      search: q ?? null,
      tags: normalizedTags.length ? normalizedTags : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      isTest,
    };

    const result = await getCatalogItems(filters, {
      role: auth.role,
      cksCode: auth.cksCode,
      isAdmin: auth.isAdmin,
    });
    reply.send({ data: result });
  });

  server.get('/api/admin/catalog/ecosystems', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    try {
      const result = await listCatalogManagerEcosystems();
      reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch ecosystem list');
      reply.code(500).send({ error: 'Failed to fetch ecosystem list' });
    }
  });

  server.get('/api/catalog/creation-ecosystems', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const role = (account.role ?? '').trim().toLowerCase();
    if (role !== 'admin' && role !== 'manager' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins, managers, and warehouses can view creation ecosystems' });
      return;
    }

    try {
      if (role === 'admin') {
        const result = await listCatalogManagerEcosystems();
        reply.send({
          success: true,
          data: result,
        });
        return;
      }

      if (role === 'manager') {
        const managerId = (account.cksCode ?? '').trim().toUpperCase();
        if (!managerId) {
          reply.send({ success: true, data: [] });
          return;
        }
        const manager = await query<{ name: string | null }>(
          `SELECT name
           FROM managers
           WHERE UPPER(manager_id) = UPPER($1)
           LIMIT 1`,
          [managerId],
        );
        reply.send({
          success: true,
          data: [{
            ecosystemId: managerId,
            ecosystemName: manager.rows[0]?.name ?? managerId,
          }],
        });
        return;
      }

      const result = await listCatalogManagerEcosystems();
      const warehouseId = (account.cksCode ?? '').trim().toUpperCase();
      if (!warehouseId) {
        reply.send({ success: true, data: result });
        return;
      }

      const fallbackEcosystemIds = await collectWarehouseEcosystemIds(warehouseId);
      if (fallbackEcosystemIds.length === 0) {
        reply.send({ success: true, data: result });
        return;
      }

      const knownIds = new Set(result.map((entry) => entry.ecosystemId.trim().toUpperCase()));
      const fallbackRowsById = new Map<string, string | null>();
      const missingIds = fallbackEcosystemIds.filter((id) => !knownIds.has(id));

      if (missingIds.length > 0) {
        const fallbackRows = await query<{ ecosystem_id: string; ecosystem_name: string | null }>(
          `SELECT manager_id AS ecosystem_id, name AS ecosystem_name
           FROM managers
           WHERE UPPER(manager_id) = ANY($1::text[])`,
          [missingIds],
        );
        for (const row of fallbackRows.rows) {
          fallbackRowsById.set(row.ecosystem_id.trim().toUpperCase(), row.ecosystem_name ?? null);
        }
      }

      const merged = [...result];
      for (const ecosystemId of fallbackEcosystemIds) {
        if (knownIds.has(ecosystemId)) {
          continue;
        }
        merged.push({
          ecosystemId,
          ecosystemName: fallbackRowsById.get(ecosystemId) ?? ecosystemId,
        });
      }

      reply.send({
        success: true,
        data: merged,
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch creation ecosystems');
      reply.code(500).send({ error: 'Failed to fetch creation ecosystems' });
    }
  });

  server.get('/api/admin/catalog/visibility/:ecosystemManagerId', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const paramsSchema = z.object({ ecosystemManagerId: z.string().trim().min(1) });
    const visibilityQuerySchema = z.object({
      type: z.enum(['product', 'service']),
    });

    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedQuery = visibilityQuerySchema.safeParse(request.query);
    if (!parsedParams.success || !parsedQuery.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const ecosystemManagerId = parsedParams.data.ecosystemManagerId.trim().toUpperCase();
    const itemType = parsedQuery.data.type;

    try {
      const [policyResult, selectedResult, allItemsResult] = await Promise.all([
        query<{ visibility_mode: 'all' | 'allowlist' }>(
          `SELECT visibility_mode
           FROM catalog_ecosystem_visibility_policies
           WHERE UPPER(ecosystem_manager_id) = UPPER($1) AND item_type = $2
           LIMIT 1`,
          [ecosystemManagerId, itemType],
        ),
        query<{ item_code: string }>(
          `SELECT item_code
           FROM catalog_ecosystem_visibility_items
           WHERE UPPER(ecosystem_manager_id) = UPPER($1) AND item_type = $2
           ORDER BY item_code ASC`,
          [ecosystemManagerId, itemType],
        ),
        itemType === 'product'
          ? query<{ item_code: string; name: string; category: string | null }>(
              `SELECT product_id AS item_code, name, category
               FROM catalog_products
               WHERE is_active = TRUE
               ORDER BY name ASC`,
              [],
            )
          : query<{ item_code: string; name: string; category: string | null }>(
              `SELECT service_id AS item_code, name, category
               FROM catalog_services
               WHERE is_active = TRUE
               ORDER BY name ASC`,
              [],
            ),
      ]);

      const mode = policyResult.rows[0]?.visibility_mode ?? 'all';
      const selectedCodes = selectedResult.rows.map((row) => row.item_code.toUpperCase());
      const selectedSet = new Set(selectedCodes);

      reply.send({
        success: true,
        data: {
          ecosystemManagerId,
          type: itemType,
          mode,
          selectedItemCodes: selectedCodes,
          items: allItemsResult.rows.map((row) => ({
            code: row.item_code,
            name: row.name,
            category: row.category,
            selected: selectedSet.has(row.item_code.toUpperCase()),
          })),
        },
      });
    } catch (error) {
      request.log.error({ err: error, ecosystemManagerId, itemType }, 'Failed to fetch catalog visibility');
      reply.code(500).send({ error: 'Failed to fetch catalog visibility' });
    }
  });

  server.put('/api/admin/catalog/visibility/:ecosystemManagerId', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
      return;
    }

    const paramsSchema = z.object({ ecosystemManagerId: z.string().trim().min(1) });
    const bodySchema = z.object({
      type: z.enum(['product', 'service']),
      mode: z.enum(['all', 'allowlist']),
      itemCodes: z.array(z.string()).optional(),
    });

    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedBody = bodySchema.safeParse(request.body);
    if (!parsedParams.success || !parsedBody.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const ecosystemManagerId = parsedParams.data.ecosystemManagerId.trim().toUpperCase();
    const { type: itemType, mode } = parsedBody.data;
    const itemCodes = normalizeCodes(parsedBody.data.itemCodes);

    const expectedPrefix = itemType === 'product' ? 'PRD-' : 'SRV-';
    const malformedCodes = itemCodes.filter((code) => !code.startsWith(expectedPrefix));
    if (malformedCodes.length > 0) {
      reply.code(400).send({
        error: `All ${itemType} codes must start with ${expectedPrefix}`,
        invalidCodes: malformedCodes,
      });
      return;
    }

    if (mode === 'allowlist' && itemCodes.length > 0) {
      const existingResult =
        itemType === 'product'
          ? await query<{ code: string }>(
              `SELECT product_id AS code FROM catalog_products WHERE product_id = ANY($1::text[])`,
              [itemCodes],
            )
          : await query<{ code: string }>(
              `SELECT service_id AS code FROM catalog_services WHERE service_id = ANY($1::text[])`,
              [itemCodes],
            );

      const existingSet = new Set(existingResult.rows.map((row) => row.code.toUpperCase()));
      const missingCodes = itemCodes.filter((code) => !existingSet.has(code));
      if (missingCodes.length > 0) {
        reply.code(400).send({
          error: `Some ${itemType} codes do not exist`,
          missingCodes,
        });
        return;
      }
    }

    try {
      await withTransaction(async (tx) => {
        await tx(
          `INSERT INTO catalog_ecosystem_visibility_policies (
             ecosystem_manager_id, item_type, visibility_mode, updated_by
           ) VALUES ($1, $2, $3, $4)
           ON CONFLICT (ecosystem_manager_id, item_type)
           DO UPDATE SET
             visibility_mode = EXCLUDED.visibility_mode,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()`,
          [ecosystemManagerId, itemType, mode, admin.cksCode ?? 'ADMIN'],
        );

        await tx(
          `DELETE FROM catalog_ecosystem_visibility_items
           WHERE UPPER(ecosystem_manager_id) = UPPER($1) AND item_type = $2`,
          [ecosystemManagerId, itemType],
        );

        if (mode === 'allowlist' && itemCodes.length > 0) {
          await tx(
            `INSERT INTO catalog_ecosystem_visibility_items (
               ecosystem_manager_id, item_type, item_code, created_by
             )
             SELECT $1, $2, code, $3
             FROM UNNEST($4::text[]) AS code
             ON CONFLICT (ecosystem_manager_id, item_type, item_code) DO NOTHING`,
            [ecosystemManagerId, itemType, admin.cksCode ?? 'ADMIN', itemCodes],
          );
        }
      });

      reply.send({
        success: true,
        data: {
          ecosystemManagerId,
          type: itemType,
          mode,
          selectedCount: mode === 'allowlist' ? itemCodes.length : 0,
        },
      });
    } catch (error) {
      request.log.error({ err: error, ecosystemManagerId, itemType, mode }, 'Failed to update catalog visibility');
      reply.code(500).send({ error: 'Failed to update catalog visibility' });
    }
  });

  // Get catalog service details by ID (on-demand fetching for modals)
  // Session-based auth pattern (matches services/routes pattern)
  server.get('/api/catalog/services/:serviceId/details', async (request, reply) => {
    const user = await requireActiveRole(request, reply, {});
    if (!user) {
      return;
    }

    console.log('[CATALOG_DETAILS] User authenticated:', { role: user.role });

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const p = paramsSchema.safeParse(request.params);
    if (!p.success) {
      reply.code(400).send({ error: 'Invalid service ID' });
      return;
    }

    const { serviceId } = p.data;
    const normalizedId = serviceId.toUpperCase();

    console.log('[CATALOG_DETAILS] Fetching service:', normalizedId);

    try {
      const canAccess = await isCatalogItemVisible(
        { role: user.role, cksCode: user.cksCode, isAdmin: user.isAdmin },
        'service',
        normalizedId,
      );
      if (!canAccess) {
        return reply.code(404).send({ error: 'Service not found' });
      }

      // Fetch service from catalog_services table
      console.log('[CATALOG_DETAILS] Step 1: Querying catalog_services table');
      const result = await query<{
        service_id: string;
        name: string;
        category: string | null;
        description: string | null;
        tags: string[] | null;
        is_active: boolean;
        metadata: any;
        image_url: string | null;
        base_price: string | null;
        currency: string | null;
        unit_of_measure: string | null;
        duration_minutes: number | null;
        service_window: string | null;
        attributes: any;
        crew_required: number | null;
        managed_by: string | null;
        created_at: Date;
        updated_at: Date;
        archived_at?: Date | null;
        archived_by?: string | null;
        deletion_scheduled?: Date | null;
      }>(
        `SELECT
          service_id,
          name,
          category,
          description,
          tags,
          is_active,
          metadata,
          image_url,
          base_price,
          currency,
          unit_of_measure,
          duration_minutes,
          service_window,
          attributes,
          crew_required,
          managed_by,
          created_at,
          updated_at,
          archived_at,
          archived_by,
          deletion_scheduled
         FROM catalog_services
         WHERE UPPER(service_id) = $1
         LIMIT 1`,
        [normalizedId]
      );

      console.log('[CATALOG_DETAILS] Step 1 complete: Found service, rowCount:', result.rowCount);

      if (result.rowCount === 0) {
        return reply.code(404).send({ error: 'Service not found' });
      }

      const row = result.rows[0];
      const serviceMetadata = (row.metadata && typeof row.metadata === 'object')
        ? (row.metadata as Record<string, unknown>)
        : {};
      const approvalStages = Array.isArray(serviceMetadata.approvalStages)
        ? serviceMetadata.approvalStages
        : [];

      // Build response data
      const data: any = {
        serviceId: row.service_id,
        name: row.name,
        category: canonicalizeCatalogCategory('service', row.category, row.service_id),
        description: row.description,
        tags: row.tags || [],
        status: row.is_active ? 'active' : 'inactive',
        metadata: serviceMetadata,
        imageUrl: row.image_url,
        price: row.base_price ? {
          amount: row.base_price,
          currency: row.currency || 'USD',
          unitOfMeasure: row.unit_of_measure
        } : null,
        durationMinutes: row.duration_minutes,
        serviceWindow: row.service_window,
        attributes: row.attributes,
        crewRequired: row.crew_required,
        managedBy: row.managed_by || 'manager',
        approvalStages,
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      };

      // Determine lifecycle state and metadata (root-level for ModalProvider)
      const svcState: 'active' | 'archived' = row.is_active ? 'active' : 'archived';
      const archivedAt = row.archived_at ? row.archived_at.toISOString() : undefined;
      const archivedBy = row.archived_by || undefined;
      const deletionScheduled = row.deletion_scheduled ? row.deletion_scheduled.toISOString() : undefined;

      const normalizedViewerCode = (user.cksCode ?? '').trim().toUpperCase();
      const normalizedViewerRole = (user.role ?? '').trim().toLowerCase();
      const canManagerEditCatalogService =
        normalizedViewerRole === 'manager' &&
        (await isManagerCertifiedForCatalogService(normalizedViewerCode, normalizedId));
      data.canManageCatalogService = normalizedViewerRole === 'admin' || canManagerEditCatalogService;

      // If admin, include certifications AND full directory lists
      const isAdmin = (user.role || '').toLowerCase() === 'admin';
      console.log('[CATALOG_DETAILS] Admin check:', { userRole: user.role, isAdmin });

      if (isAdmin) {
        console.log('[CATALOG_DETAILS] Step 2: Fetching certifications');
        // Get certifications
        const certResult = await query<{ user_id: string; role: string }>(
          `SELECT user_id, role FROM service_certifications WHERE service_id = $1 AND archived_at IS NULL`,
          [normalizedId]
        );
        console.log('[CATALOG_DETAILS] Step 2 complete: Certifications count:', certResult.rowCount);

        const certifiedManagers: string[] = [];
        const certifiedContractors: string[] = [];
        const certifiedCrew: string[] = [];
        const certifiedWarehouses: string[] = [];

        for (const cert of certResult.rows) {
          if (cert.role === 'manager') certifiedManagers.push(cert.user_id);
          else if (cert.role === 'contractor') certifiedContractors.push(cert.user_id);
          else if (cert.role === 'crew') certifiedCrew.push(cert.user_id);
          else if (cert.role === 'warehouse') certifiedWarehouses.push(cert.user_id);
        }

        // Get ALL directory lists (for certification UI)
        console.log('[CATALOG_DETAILS] Step 3: Fetching directory lists (managers, contractors, crew, warehouses)');
        const [managersResult, contractorsResult, crewResult, warehousesResult] = await Promise.all([
          query<{ manager_id: string; name: string }>(`SELECT manager_id, name FROM managers WHERE status = 'active' ORDER BY name`),
          query<{ contractor_id: string; name: string }>(`SELECT contractor_id, name FROM contractors WHERE status = 'active' ORDER BY name`),
          query<{ crew_id: string; name: string }>(`SELECT crew_id, name FROM crew WHERE status = 'active' ORDER BY name`),
          query<{ warehouse_id: string; name: string }>(`SELECT warehouse_id, name FROM warehouses WHERE status = 'active' ORDER BY name`)
        ]);
        console.log('[CATALOG_DETAILS] Step 3 complete: Directory counts:', {
          managers: managersResult.rowCount,
          contractors: contractorsResult.rowCount,
          crew: crewResult.rowCount,
          warehouses: warehousesResult.rowCount
        });

        data.peopleManagers = managersResult.rows.map(r => ({ code: r.manager_id, name: r.name }));
        data.peopleContractors = contractorsResult.rows.map(r => ({ code: r.contractor_id, name: r.name }));
        data.peopleCrew = crewResult.rows.map(r => ({ code: r.crew_id, name: r.name }));
        data.peopleWarehouses = warehousesResult.rows.map(r => ({ code: r.warehouse_id, name: r.name }));

        data.certifiedManagers = certifiedManagers;
        data.certifiedContractors = certifiedContractors;
        data.certifiedCrew = certifiedCrew;
        data.certifiedWarehouses = certifiedWarehouses;

        console.log('[CATALOG_DETAILS] Admin data attached:', {
          peopleManagersCount: data.peopleManagers.length,
          certifiedManagersCount: certifiedManagers.length
        });
      }

      console.log('[CATALOG_DETAILS] Sending response with data keys:', Object.keys(data));
      return reply.send({
        data,
        state: svcState,
        archivedAt,
        archivedBy,
        scheduledDeletion: deletionScheduled,
      });
    } catch (error) {
      console.error('[CATALOG_DETAILS] ERROR:', error);
      request.log.error({ err: error, serviceId }, 'Failed to fetch catalog service details');
      reply.code(500).send({ error: 'Failed to fetch service details' });
    }
  });

  // Get catalog product details by ID (on-demand fetching for modals)
  server.get('/api/catalog/products/:productId/details', async (request, reply) => {
    const user = await requireActiveRole(request, reply, {});
    if (!user) return;

    const paramsSchema = z.object({ productId: z.string().min(1) });
    const p = paramsSchema.safeParse(request.params);
    if (!p.success) {
      reply.code(400).send({ error: 'Invalid product ID' });
      return;
    }

    const { productId } = p.data;
    const normalizedId = productId.toUpperCase();

    try {
      const canAccess = await isCatalogItemVisible(
        { role: user.role, cksCode: user.cksCode, isAdmin: user.isAdmin },
        'product',
        normalizedId,
      );
      if (!canAccess) {
        reply.code(404).send({ error: 'Product not found' });
        return;
      }

      // Fetch product from catalog_products
      const result = await query<{
        product_id: string;
        name: string;
        description: string | null;
        image_url: string | null;
        category: string | null;
        unit_of_measure: string | null;
        is_active: boolean;
        metadata: any;
        archived_at?: Date | null;
        archived_by?: string | null;
        deletion_scheduled?: Date | null;
        deleted_at?: Date | null;
        deleted_by?: string | null;
      }>(
        `SELECT product_id, name, description, image_url, category, unit_of_measure, is_active, metadata, archived_at, archived_by, deletion_scheduled
         FROM catalog_products
         WHERE UPPER(product_id) = $1`,
        [normalizedId]
      );

      if (result.rowCount === 0) {
        reply.code(404).send({ error: 'Product not found' });
        return;
      }

      const product = result.rows[0];
      const productMetadata = (product.metadata && typeof product.metadata === 'object')
        ? (product.metadata as Record<string, unknown>)
        : {};
      const approvalStages = Array.isArray(productMetadata.approvalStages)
        ? productMetadata.approvalStages
        : [];

      // Fetch inventory data for this product across warehouses
      const inventoryResult = await query<{
        warehouse_id: string;
        warehouse_name: string | null;
        quantity_on_hand: number;
        min_stock_level: number | null;
      }>(
        `SELECT
           i.warehouse_id,
           w.name as warehouse_name,
           i.quantity_on_hand,
           i.min_stock_level
         FROM inventory_items i
         LEFT JOIN warehouses w ON UPPER(w.warehouse_id) = UPPER(i.warehouse_id)
         WHERE UPPER(i.item_id) = $1`,
        [normalizedId]
      );

      const inventoryData = inventoryResult.rows.map(row => ({
        warehouseId: row.warehouse_id,
        warehouseName: row.warehouse_name || row.warehouse_id,
        quantityOnHand: row.quantity_on_hand,
        minStockLevel: row.min_stock_level,
        location: null, // location not in schema
      }));

      // Determine lifecycle state using is_active (archive sets is_active = FALSE)
      const state: 'active' | 'archived' = product.is_active ? 'active' : 'archived';
      const archivedAt = product.archived_at ? new Date(product.archived_at).toISOString() : undefined;
      const archivedBy = product.archived_by || undefined;
      const deletionScheduled = product.deletion_scheduled ? new Date(product.deletion_scheduled).toISOString() : undefined;

      reply.send({
        data: {
          productId: product.product_id,
          name: product.name,
          description: product.description,
          imageUrl: product.image_url,
          category: canonicalizeCatalogCategory('product', product.category, product.product_id),
          unitOfMeasure: product.unit_of_measure,
          status: state, // Keep in data for backward compat
          metadata: productMetadata,
          approvalStages,
          inventoryData,
        },
        state, // Lifecycle state at root level for ModalProvider
        archivedAt,
        archivedBy,
        scheduledDeletion: deletionScheduled,
      });
    } catch (error) {
      console.error('[CATALOG] Product details fetch error:', error);
      reply.code(500).send({ error: 'Failed to fetch product details' });
    }
  });

  // Admin or certified manager: update catalog service metadata/fields
  server.patch('/api/admin/catalog/services/:serviceId', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) {
      return;
    }

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const bodySchema = z.object({
      name: z.string().trim().min(1).optional(),
      category: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      imageUrl: z.string().trim().optional(),
      tags: z.array(z.string().trim()).optional(),
      isActive: z.boolean().optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    });

    const p = paramsSchema.safeParse(request.params);
    const b = bodySchema.safeParse(request.body);
    if (!p.success || !b.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const serviceId = p.data.serviceId.trim().toUpperCase();
    const { name, category, description, imageUrl, tags, isActive, metadata } = b.data;
    const role = (account.role ?? '').trim().toLowerCase();
    const normalizedAccountCode = (account.cksCode ?? '').trim().toUpperCase();

    if (role !== 'admin') {
      if (role !== 'manager') {
        reply.code(403).send({ error: 'Only admins or certified managers can update services' });
        return;
      }
      const canManage = await isManagerCertifiedForCatalogService(normalizedAccountCode, serviceId);
      if (!canManage) {
        reply.code(403).send({ error: 'You can only edit services you are certified for' });
        return;
      }
      if (isActive !== undefined || metadata !== undefined) {
        reply.code(403).send({ error: 'Managers can only edit service details and images' });
        return;
      }
    }

    console.log('[CATALOG] PATCH service:', serviceId);
    console.log('[CATALOG] Received metadata:', JSON.stringify(metadata, null, 2));

    const sets: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { params.push(name); sets.push(`name = $${params.length}`); }
    if (category !== undefined) { params.push(category); sets.push(`category = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
    if (imageUrl !== undefined) { params.push(imageUrl); sets.push(`image_url = $${params.length}`); }
    if (Array.isArray(tags)) { params.push(tags); sets.push(`tags = $${params.length}`); }
    if (isActive !== undefined) { params.push(isActive); sets.push(`is_active = $${params.length}`); }
    if (metadata !== undefined) {
      params.push(JSON.stringify(metadata));
      sets.push(`metadata = COALESCE(metadata, '{}'::jsonb) || $${params.length}::jsonb`);
    }

    if (sets.length === 0) {
      reply.send({ success: true });
      return;
    }

    params.push(serviceId);
    try {
      const sql = `UPDATE catalog_services
         SET ${sets.join(', ')}, updated_at = NOW()
         WHERE UPPER(service_id) = UPPER($${params.length})`;
      console.log('[CATALOG] Executing SQL:', sql);
      console.log('[CATALOG] With params:', params);

      const updateResult = await query(sql, params);
      if (updateResult.rowCount === 0) {
        reply.code(404).send({ error: `Service ${serviceId} not found` });
        return;
      }

      console.log('[CATALOG] Update successful for service:', serviceId);
      reply.send({ success: true });
    } catch (error) {
      console.error('[CATALOG] Update failed:', error);
      request.log.error({ err: error, serviceId }, 'update catalog service failed');
      reply.code(500).send({ error: 'Failed to update catalog service' });
    }
  });

  // Admin: get current certifications for a service
  server.get('/api/admin/catalog/services/:serviceId/certifications', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const p = paramsSchema.safeParse(request.params);
    if (!p.success) {
      reply.code(400).send({ error: 'Invalid service id' });
      return;
    }
    const { serviceId } = p.data;
    const rows = await query<{ user_id: string; role: string }>(
      `SELECT user_id, role FROM service_certifications WHERE service_id = $1 AND archived_at IS NULL`,
      [serviceId],
    );
    const managers: string[] = [];
    const contractors: string[] = [];
    const crew: string[] = [];
    const warehouses: string[] = [];
    for (const r of rows.rows) {
      if (r.role === 'manager') managers.push(r.user_id);
      else if (r.role === 'contractor') contractors.push(r.user_id);
      else if (r.role === 'crew') crew.push(r.user_id);
      else if (r.role === 'warehouse') warehouses.push(r.user_id);
    }
    reply.send({ success: true, data: { managers, contractors, crew, warehouses } });
  });

  // Admin: assign/unassign certifications for a service
  server.patch('/api/admin/catalog/services/:serviceId/assign', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ serviceId: z.string().min(1) });
    const bodySchema = z.object({
      role: z.enum(['manager','contractor','crew','warehouse']),
      add: z.array(z.string()).default([]),
      remove: z.array(z.string()).default([]),
    });

    const p = paramsSchema.safeParse(request.params);
    const b = bodySchema.safeParse(request.body);
    if (!p.success || !b.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }
    const { serviceId } = p.data;
    const { role, add, remove } = b.data;

    // Fetch service name for activity descriptions
    const serviceResult = await query<{ name: string }>(
      `SELECT name FROM catalog_services WHERE service_id = $1 LIMIT 1`,
      [serviceId]
    );
    const serviceName = serviceResult.rows[0]?.name || serviceId;

    // Insert new certifications and write activity per user
    for (const raw of add) {
      const uid = (raw || '').toString().trim().toUpperCase();
      if (!uid) continue;
      await query(
        `INSERT INTO service_certifications (service_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (service_id, user_id, role) DO UPDATE SET archived_at = NULL, created_at = NOW()`,
        [serviceId, uid, role],
      );

      // Recent Activity: User certified for this catalog service
      try {
        await recordActivity({
          activityType: 'catalog_service_certified',
          description: `Certified ${uid} for ${serviceId}`,
          actorId: admin.cksCode || 'ADMIN',
          actorRole: 'admin',
          targetId: serviceId,
          targetType: 'catalogService',
          metadata: { userId: uid, role, serviceName, serviceId },
        });
      } catch (err) {
        console.warn('[catalog] failed to record catalog_service_certified', { serviceId, uid, err: (err as Error)?.message });
      }
    }
    // Archive removed ones
    if (remove.length) {
      const removeIds = remove.map((r: string) => (r || '').toString().trim().toUpperCase()).filter(Boolean);
      if (removeIds.length) {
      await query(
        `UPDATE service_certifications
         SET archived_at = NOW()
         WHERE service_id = $1 AND role = $2 AND user_id = ANY($3::text[])`,
        [serviceId, role, removeIds],
      );

      // Recent Activity: User certification removed
      for (const uid of removeIds) {
        try {
          await recordActivity({
            activityType: 'catalog_service_decertified',
            description: `Uncertified ${uid} for ${serviceId}`,
            actorId: admin.cksCode || 'ADMIN',
            actorRole: 'admin',
            targetId: serviceId,
            targetType: 'catalogService',
            metadata: { userId: uid, role, serviceName, serviceId },
          });
        } catch (err) {
          console.warn('[catalog] failed to record catalog_service_decertified', { serviceId, uid, err: (err as Error)?.message });
        }
      }
      }
    }
    reply.send({ success: true });
  });

  server.get('/api/admin/catalog/service-requests', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const querySchema = z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'all']).default('pending'),
      limit: z.coerce.number().int().min(1).max(500).default(100),
    });

    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const { status, limit } = parsed.data;
    const hasStatusFilter = status !== 'all';

    try {
      const sql = `
        SELECT
          r.request_id,
          r.manager_id,
          m.name AS manager_name,
          w.name AS warehouse_name,
          r.service_name,
          r.description,
          r.category,
          r.status,
          r.approved_service_id,
          r.metadata,
          r.requested_at,
          r.reviewed_at,
          r.reviewed_by,
          r.review_notes
        FROM catalog_service_requests r
        LEFT JOIN managers m ON UPPER(m.manager_id) = UPPER(r.manager_id)
        LEFT JOIN warehouses w
          ON LOWER(COALESCE(r.metadata->>'requesterRole', 'manager')) = 'warehouse'
         AND UPPER(w.warehouse_id) = UPPER(r.metadata->>'requesterId')
        ${hasStatusFilter ? 'WHERE r.status = $1' : ''}
        ORDER BY r.requested_at DESC
        LIMIT $${hasStatusFilter ? '2' : '1'}
      `;
      const params = hasStatusFilter ? [status, limit] : [limit];
      const result = await query<{
        request_id: string;
        manager_id: string;
        manager_name: string | null;
        warehouse_name: string | null;
        service_name: string;
        description: string | null;
        category: string;
        status: 'pending' | 'approved' | 'rejected';
        approved_service_id: string | null;
        metadata: Record<string, unknown> | null;
        requested_at: Date | string;
        reviewed_at: Date | string | null;
        reviewed_by: string | null;
        review_notes: string | null;
      }>(sql, params);

      reply.send({
        success: true,
        data: result.rows.map((row) => {
          const requestMeta = parseServiceRequestMetadata(row.metadata, row.manager_id);
          const requesterName =
            requestMeta.requesterRole === 'warehouse'
              ? row.warehouse_name || requestMeta.requesterName || requestMeta.requesterId
              : row.manager_name || requestMeta.requesterName || requestMeta.requesterId;

          return {
            requestId: row.request_id,
            managerId: row.manager_id,
            managerName: row.manager_name,
            requesterId: requestMeta.requesterId,
            requesterRole: requestMeta.requesterRole,
            requesterName,
            managedBy: requestMeta.managedBy,
            serviceName: row.service_name,
            description: row.description,
            category: row.category,
            status: row.status,
            approvedServiceId: row.approved_service_id,
            requestedAt: row.requested_at,
            reviewedAt: row.reviewed_at,
            reviewedBy: row.reviewed_by,
            reviewNotes: row.review_notes,
            approvalStages: buildServiceRequestApprovalStages(
              row.status,
              requestMeta.requesterRole,
              requesterName,
              requestMeta.requesterId,
              row.reviewed_by,
              row.requested_at,
              row.reviewed_at,
            ),
          };
        }),
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to list catalog service requests');
      reply.code(500).send({ error: 'Failed to list service requests' });
    }
  });

  server.get('/api/catalog/service-requests/:requestId', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const role = (account.role ?? '').trim().toLowerCase();
    if (role !== 'admin' && role !== 'manager' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins, managers, and warehouses can view service requests' });
      return;
    }

    const paramsSchema = z.object({ requestId: z.string().trim().min(1) });
    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      reply.code(400).send({ error: 'Invalid request ID' });
      return;
    }

    const requestId = parsedParams.data.requestId.trim().toUpperCase();
    const viewerCode = (account.cksCode ?? '').trim().toUpperCase();

    try {
      const result = await query<{
        request_id: string;
        manager_id: string;
        manager_name: string | null;
        warehouse_name: string | null;
        service_name: string;
        description: string | null;
        category: string;
        status: 'pending' | 'approved' | 'rejected';
        approved_service_id: string | null;
        metadata: Record<string, unknown> | null;
        requested_at: Date | string;
        reviewed_at: Date | string | null;
        reviewed_by: string | null;
        review_notes: string | null;
      }>(
        `SELECT
           r.request_id,
           r.manager_id,
           m.name AS manager_name,
           w.name AS warehouse_name,
           r.service_name,
           r.description,
           r.category,
           r.status,
           r.approved_service_id,
           r.metadata,
           r.requested_at,
           r.reviewed_at,
           r.reviewed_by,
           r.review_notes
         FROM catalog_service_requests r
         LEFT JOIN managers m ON UPPER(m.manager_id) = UPPER(r.manager_id)
         LEFT JOIN warehouses w
           ON LOWER(COALESCE(r.metadata->>'requesterRole', 'manager')) = 'warehouse'
          AND UPPER(w.warehouse_id) = UPPER(r.metadata->>'requesterId')
         WHERE UPPER(r.request_id) = UPPER($1)
         LIMIT 1`,
        [requestId],
      );

      if (!result.rowCount) {
        reply.code(404).send({ error: 'Service request not found' });
        return;
      }

      const row = result.rows[0];
      const requestMeta = parseServiceRequestMetadata(row.metadata, row.manager_id);
      const requesterName =
        requestMeta.requesterRole === 'warehouse'
          ? row.warehouse_name || requestMeta.requesterName || requestMeta.requesterId
          : row.manager_name || requestMeta.requesterName || requestMeta.requesterId;
      if (role === 'manager' && row.manager_id.trim().toUpperCase() !== viewerCode) {
        reply.code(404).send({ error: 'Service request not found' });
        return;
      }
      if (role === 'warehouse') {
        const isOwner =
          requestMeta.requesterRole === 'warehouse' &&
          requestMeta.requesterId.trim().toUpperCase() === viewerCode;
        if (!isOwner) {
          reply.code(404).send({ error: 'Service request not found' });
          return;
        }
      }

      reply.send({
        success: true,
        data: {
          requestId: row.request_id,
          managerId: row.manager_id,
          managerName: row.manager_name,
          requesterId: requestMeta.requesterId,
          requesterRole: requestMeta.requesterRole,
          requesterName,
          managedBy: requestMeta.managedBy,
          serviceName: row.service_name,
          description: row.description,
          category: row.category,
          status: row.status,
          approvedServiceId: row.approved_service_id,
          requestedAt: row.requested_at,
          reviewedAt: row.reviewed_at,
          reviewedBy: row.reviewed_by,
          reviewNotes: row.review_notes,
          approvalStages: buildServiceRequestApprovalStages(
            row.status,
            requestMeta.requesterRole,
            requesterName,
            requestMeta.requesterId,
            row.reviewed_by,
            row.requested_at,
            row.reviewed_at,
          ),
        },
      });
    } catch (error) {
      request.log.error({ err: error, requestId }, 'Failed to fetch catalog service request');
      reply.code(500).send({ error: 'Failed to fetch service request' });
    }
  });

  server.post('/api/admin/catalog/service-requests/:requestId/approve', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ requestId: z.string().trim().min(1) });
    const bodySchema = z.object({ notes: z.string().trim().max(500).optional() });
    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedBody = bodySchema.safeParse(request.body ?? {});
    if (!parsedParams.success || !parsedBody.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const requestId = parsedParams.data.requestId.trim().toUpperCase();
    const notes = parsedBody.data.notes || null;
    const actorId = admin.cksCode || 'ADMIN';

    try {
      const approved = await withTransaction(async (txQuery) => {
        const requestResult = await txQuery<{
          request_id: string;
          manager_id: string;
          service_name: string;
          description: string | null;
          category: string;
          unit_of_measure: string | null;
          base_price: string | null;
          duration_minutes: number | null;
          service_window: string | null;
          crew_required: number | null;
          metadata: Record<string, unknown> | null;
          status: 'pending' | 'approved' | 'rejected';
        }>(
          `SELECT request_id, manager_id, service_name, description, category, unit_of_measure,
                  base_price, duration_minutes, service_window, crew_required, metadata, status
           FROM catalog_service_requests
           WHERE UPPER(request_id) = UPPER($1)
           FOR UPDATE`,
          [requestId],
        );

        if (!requestResult.rowCount) {
          throw createHttpError(404, 'Service request not found');
        }

        const serviceRequest = requestResult.rows[0];
        if (serviceRequest.status !== 'pending') {
          throw createHttpError(409, `Service request is already ${serviceRequest.status}`);
        }
        const requestMeta = parseServiceRequestMetadata(serviceRequest.metadata, serviceRequest.manager_id);

        const maxResult = await txQuery<{ max_num: string | null }>(
          `SELECT MAX(CAST(SUBSTRING(service_id FROM 5) AS INTEGER)) AS max_num
           FROM catalog_services
           WHERE service_id ~ '^SRV-[0-9]+$'`,
          [],
        );
        const nextNum = (Number(maxResult.rows[0]?.max_num) || 0) + 1;
        const serviceId = `SRV-${String(nextNum).padStart(3, '0')}`;

        await txQuery(
          `INSERT INTO catalog_services (
            service_id, name, description, category, unit_of_measure,
            base_price, duration_minutes, service_window, crew_required,
            metadata, managed_by, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, TRUE, NOW(), NOW())`,
          [
            serviceId,
            serviceRequest.service_name,
            serviceRequest.description || null,
            serviceRequest.category || null,
            serviceRequest.unit_of_measure || null,
            serviceRequest.base_price || null,
            serviceRequest.duration_minutes ?? null,
            serviceRequest.service_window || null,
            serviceRequest.crew_required ?? null,
            JSON.stringify({
              sourceRequestId: requestId,
              ecosystemManagerId: requestMeta.ecosystemManagerId,
              requestedById: requestMeta.requesterId,
              requestedByRole: requestMeta.requesterRole,
              requesterName: requestMeta.requesterName || null,
              approvalStages: buildServiceRequestApprovalStages(
                'approved',
                requestMeta.requesterRole,
                requestMeta.requesterName,
                requestMeta.requesterId,
                actorId,
                new Date().toISOString(),
                new Date().toISOString(),
              ),
            }),
            requestMeta.managedBy,
          ],
        );

        if (requestMeta.requesterRole === 'manager') {
          await txQuery(
            `INSERT INTO service_certifications (service_id, user_id, role)
             VALUES ($1, $2, 'manager')
             ON CONFLICT (service_id, user_id, role)
             DO UPDATE SET archived_at = NULL, created_at = NOW()`,
            [serviceId, requestMeta.requesterId],
          );
        } else {
          await txQuery(
            `INSERT INTO service_certifications (service_id, user_id, role)
             VALUES ($1, $2, 'warehouse')
             ON CONFLICT (service_id, user_id, role)
             DO UPDATE SET archived_at = NULL, created_at = NOW()`,
            [serviceId, requestMeta.requesterId],
          );
        }

        await txQuery(
          `UPDATE catalog_service_requests
           SET status = 'approved',
               approved_service_id = $2,
               reviewed_by = $3,
               review_notes = $4,
               reviewed_at = NOW()
           WHERE UPPER(request_id) = UPPER($1)`,
          [requestId, serviceId, actorId, notes],
        );

        await ensureAllowlistItemForAllEcosystems(
          'service',
          serviceId,
          actorId,
          txQuery,
        );

        await recordActivity({
          activityType: 'catalog_service_request_approved',
          description: `${requestMeta.requesterRole === 'warehouse' ? 'Warehouse Requested Service' : 'Manager Requested Service'} approved: ${serviceId} "${serviceRequest.service_name}"`,
          actorId,
          actorRole: 'admin',
          targetId: requestId,
          // system_activity.target_type is VARCHAR(20); catalogServiceRequest exceeds it
          targetType: 'catalogService',
          metadata: {
            requestId,
            serviceId,
            serviceName: serviceRequest.service_name,
            managerId: serviceRequest.manager_id,
            requesterRole: requestMeta.requesterRole,
            requesterId: requestMeta.requesterId,
            requesterName: requestMeta.requesterName || null,
            category: serviceRequest.category,
            targetType: 'catalogServiceRequest',
          },
        }, { txQuery });

        await recordActivity({
          activityType: 'catalog_service_created',
          description: `New service ${serviceId} "${serviceRequest.service_name}" created`,
          actorId,
          actorRole: 'admin',
          targetId: serviceId,
          targetType: 'catalogService',
          metadata: {
            serviceId,
            name: serviceRequest.service_name,
            category: serviceRequest.category || null,
            createdBy: actorId,
            requestedBy: requestMeta.requesterId,
            requestedByRole: requestMeta.requesterRole,
            managedBy: requestMeta.managedBy,
            sourceRequestId: requestId,
          },
        }, { txQuery });

        await recordActivity({
          activityType: 'catalog_service_certified',
          description: `Certified ${requestMeta.requesterId} for ${serviceId}`,
          actorId,
          actorRole: 'admin',
          targetId: serviceId,
          targetType: 'catalogService',
          metadata: {
            userId: requestMeta.requesterId,
            role: requestMeta.requesterRole,
            serviceName: serviceRequest.service_name,
            serviceId,
          },
        }, { txQuery });

        return {
          requestId,
          serviceId,
          managerId: serviceRequest.manager_id,
          requesterId: requestMeta.requesterId,
          requesterRole: requestMeta.requesterRole,
          serviceName: serviceRequest.service_name,
        };
      });

      reply.send({ success: true, data: approved });
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: unknown }).statusCode)
          : 500;
      if (statusCode === 404 || statusCode === 409) {
        reply.code(statusCode).send({ error: (error as Error).message });
        return;
      }
      request.log.error({ err: error, requestId }, 'Failed to approve catalog service request');
      reply.code(500).send({ error: 'Failed to approve service request' });
    }
  });

  server.post('/api/admin/catalog/service-requests/:requestId/reject', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ requestId: z.string().trim().min(1) });
    const bodySchema = z.object({ notes: z.string().trim().min(1).max(500) });
    const parsedParams = paramsSchema.safeParse(request.params);
    const parsedBody = bodySchema.safeParse(request.body ?? {});
    if (!parsedParams.success || !parsedBody.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const requestId = parsedParams.data.requestId.trim().toUpperCase();
    const notes = parsedBody.data.notes;
    const actorId = admin.cksCode || 'ADMIN';

    try {
      const rejected = await withTransaction(async (txQuery) => {
        const requestResult = await txQuery<{
          request_id: string;
          manager_id: string;
          service_name: string;
          category: string;
          metadata: Record<string, unknown> | null;
          status: 'pending' | 'approved' | 'rejected';
        }>(
          `SELECT request_id, manager_id, service_name, category, metadata, status
           FROM catalog_service_requests
           WHERE UPPER(request_id) = UPPER($1)
           FOR UPDATE`,
          [requestId],
        );

        if (!requestResult.rowCount) {
          throw createHttpError(404, 'Service request not found');
        }

        const serviceRequest = requestResult.rows[0];
        if (serviceRequest.status !== 'pending') {
          throw createHttpError(409, `Service request is already ${serviceRequest.status}`);
        }
        const requestMeta = parseServiceRequestMetadata(serviceRequest.metadata, serviceRequest.manager_id);

        await txQuery(
          `UPDATE catalog_service_requests
           SET status = 'rejected',
               reviewed_by = $2,
               review_notes = $3,
               reviewed_at = NOW()
           WHERE UPPER(request_id) = UPPER($1)`,
          [requestId, actorId, notes],
        );

        await recordActivity({
          activityType: 'catalog_service_request_rejected',
          description: `${requestMeta.requesterRole === 'warehouse' ? 'Warehouse Requested Service' : 'Manager Requested Service'} rejected: "${serviceRequest.service_name}"`,
          actorId,
          actorRole: 'admin',
          targetId: requestId,
          // system_activity.target_type is VARCHAR(20); catalogServiceRequest exceeds it
          targetType: 'catalogService',
          metadata: {
            requestId,
            managerId: serviceRequest.manager_id,
            requesterRole: requestMeta.requesterRole,
            requesterId: requestMeta.requesterId,
            requesterName: requestMeta.requesterName || null,
            serviceName: serviceRequest.service_name,
            category: serviceRequest.category,
            notes,
            targetType: 'catalogServiceRequest',
          },
        }, { txQuery });

        return {
          requestId,
          managerId: serviceRequest.manager_id,
          requesterId: requestMeta.requesterId,
          requesterRole: requestMeta.requesterRole,
          serviceName: serviceRequest.service_name,
        };
      });

      reply.send({ success: true, data: rejected });
    } catch (error) {
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? Number((error as { statusCode: unknown }).statusCode)
          : 500;
      if (statusCode === 404 || statusCode === 409) {
        reply.code(statusCode).send({ error: (error as Error).message });
        return;
      }
      request.log.error({ err: error, requestId }, 'Failed to reject catalog service request');
      reply.code(500).send({ error: 'Failed to reject service request' });
    }
  });

  // Admin: Get inventory data for a product across all warehouses
  server.get('/api/admin/catalog/products/:productId/inventory', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

    const paramsSchema = z.object({ productId: z.string().min(1) });
    const p = paramsSchema.safeParse(request.params);
    if (!p.success) {
      reply.code(400).send({ error: 'Invalid product ID' });
      return;
    }

    const { productId } = p.data;

    try {
      // Fetch inventory records from inventory_items table (same as warehouse view)
      const result = await query<{
        warehouse_id: string;
        item_name: string;
        quantity_on_hand: number;
        min_stock_level: number | null;
      }>(
        `SELECT
          warehouse_id,
          item_name,
          quantity_on_hand,
          min_stock_level
         FROM inventory_items
         WHERE UPPER(item_id) = $1 AND status = 'active'
         ORDER BY warehouse_id`,
        [productId.toUpperCase()],
      );

      const inventoryData = result.rows.map((row) => ({
        warehouseId: row.warehouse_id,
        warehouseName: row.warehouse_id,
        quantityOnHand: Number(row.quantity_on_hand) || 0,
        minStockLevel: row.min_stock_level !== null ? Number(row.min_stock_level) : null,
        location: null,
      }));

      reply.send({ success: true, data: inventoryData });
    } catch (error) {
      request.log.error({ err: error, productId }, 'Failed to fetch product inventory');
      reply.code(500).send({
        error: 'Failed to fetch product inventory',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  server.patch('/api/admin/catalog/products/:productId', async (request, reply) => {
    // Allow admin and warehouse users to update product details (name, description, image)
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;
    const patchRole = (account.role ?? '').trim().toLowerCase();
    if (patchRole !== 'admin' && patchRole !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins and warehouse users can update products' });
      return;
    }

    const paramsSchema = z.object({ productId: z.string().min(1) });
    const bodySchema = z.object({
      name: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      imageUrl: z.string().trim().optional(),
    });

    const p = paramsSchema.safeParse(request.params);
    const b = bodySchema.safeParse(request.body);
    if (!p.success || !b.success) {
      reply.code(400).send({ error: 'Invalid request' });
      return;
    }

    const { productId } = p.data;
    const { name, description, imageUrl } = b.data;

    const sets: string[] = [];
    const params: any[] = [];
    if (name !== undefined) { params.push(name); sets.push(`name = $${params.length}`); }
    if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
    if (imageUrl !== undefined) { params.push(imageUrl); sets.push(`image_url = $${params.length}`); }

    if (sets.length === 0) {
      reply.send({ success: true });
      return;
    }

    params.push(productId);
    try {
      const sql = `UPDATE catalog_products
         SET ${sets.join(', ')}, updated_at = NOW()
         WHERE product_id = $${params.length}`;
      await query(sql, params);
      reply.send({ success: true });
    } catch (error) {
      request.log.error({ err: error, productId }, 'update catalog product failed');
      reply.code(500).send({ error: 'Failed to update catalog product' });
    }
  });

  // ── Catalog image upload (products & services) ────────────────────────
  // POST /api/catalog/upload-image
  // Accepts multipart/form-data with fields: file (image), type (product|service), itemId
  server.post('/api/catalog/upload-image', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const role = (account.role ?? '').trim().toLowerCase();

    const data = await request.file();
    if (!data) {
      reply.code(400).send({ error: 'No file uploaded' });
      return;
    }

    // Read fields from the multipart stream
    const fields = data.fields as Record<string, { value?: string } | undefined>;
    const itemType = (fields['type']?.value ?? '').trim().toLowerCase();
    const itemId = (fields['itemId']?.value ?? '').trim();
    const normalizedItemId = itemId.toUpperCase();

    if (!itemId) {
      reply.code(400).send({ error: 'Missing itemId field' });
      return;
    }
    if (itemType !== 'product' && itemType !== 'service') {
      reply.code(400).send({ error: 'type must be "product" or "service"' });
      return;
    }

    if (itemType === 'product' && role !== 'admin' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins and warehouse users can upload product images' });
      return;
    }
    if (itemType === 'service' && role !== 'admin' && role !== 'manager') {
      reply.code(403).send({ error: 'Only admins and certified managers can upload service images' });
      return;
    }

    if (itemType === 'product') {
      const productExists = await query<{ exists: number }>(
        `SELECT 1 AS exists
         FROM catalog_products
         WHERE UPPER(product_id) = UPPER($1)
         LIMIT 1`,
        [normalizedItemId],
      );
      if (productExists.rowCount === 0) {
        reply.code(404).send({ error: `Product ${normalizedItemId} not found` });
        return;
      }
    } else {
      const serviceExists = await query<{ exists: number }>(
        `SELECT 1 AS exists
         FROM catalog_services
         WHERE UPPER(service_id) = UPPER($1)
         LIMIT 1`,
        [normalizedItemId],
      );
      if (serviceExists.rowCount === 0) {
        reply.code(404).send({ error: `Service ${normalizedItemId} not found` });
        return;
      }
      if (role === 'manager') {
        if (!normalizedAccountCode) {
          reply.code(403).send({ error: 'Manager account is missing a valid manager code' });
          return;
        }
        const canManage = await isManagerCertifiedForCatalogService(normalizedAccountCode, normalizedItemId);
        if (!canManage) {
          reply.code(403).send({ error: 'You can only upload images for services you are certified for' });
          return;
        }
      }
    }

    // Validate MIME type
    const mime = data.mimetype ?? '';
    if (!mime.startsWith('image/')) {
      reply.code(400).send({ error: 'File must be an image (png, jpg, webp, etc.)' });
      return;
    }

    try {
      // Consume stream into buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Upload to Cloudinary
      const folder = itemType === 'product' ? 'cks-catalog/products' : 'cks-catalog/services';
      const result = await uploadImageToCloudinary(buffer, {
        folder,
        publicId: normalizedItemId,
      });

      const imageUrl = result.secure_url;

      // Update the database record
      let updateResult;
      if (itemType === 'product') {
        updateResult = await query(
          'UPDATE catalog_products SET image_url = $1, updated_at = NOW() WHERE product_id = $2',
          [imageUrl, normalizedItemId],
        );
      } else {
        updateResult = await query(
          'UPDATE catalog_services SET image_url = $1, updated_at = NOW() WHERE service_id = $2',
          [imageUrl, normalizedItemId],
        );
      }
      if (updateResult.rowCount === 0) {
        reply.code(404).send({
          error:
            itemType === 'product'
              ? `Product ${normalizedItemId} not found`
              : `Service ${normalizedItemId} not found`,
        });
        return;
      }

      reply.send({ success: true, imageUrl });
    } catch (error) {
      request.log.error({ err: error, itemId, itemType }, 'catalog image upload failed');
      reply.code(500).send({
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ── Catalog categories ──────────────────────────────────────────────
  // GET /api/catalog/categories
  // Returns distinct categories for products and services
  server.get('/api/catalog/categories', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const categoryQuerySchema = z.object({
      scope: z.enum(['visible', 'all']).optional(),
    });
    const parsedQuery = categoryQuerySchema.safeParse(request.query ?? {});
    if (!parsedQuery.success) {
      reply.code(400).send({ error: 'Invalid category query' });
      return;
    }

    try {
      const normalizedRole = (account.role ?? '').trim().toLowerCase();
      const canRequestAllScope =
        normalizedRole === 'admin' || normalizedRole === 'manager' || normalizedRole === 'warehouse';
      const includeAllCategories = parsedQuery.data.scope === 'all' && canRequestAllScope;

      const ecosystemManagerId = includeAllCategories
        ? null
        : await resolveCatalogEcosystemManagerId({
            role: account.role,
            cksCode: account.cksCode,
            isAdmin: account.isAdmin,
          });
      const isTest = Boolean(account.cksCode && account.cksCode.toUpperCase().includes('-TEST'));

      const buildCatalogVisibilityClause = (itemType: 'product' | 'service', itemCodeExpression: string) => {
        if (!ecosystemManagerId || itemType === 'service') {
          return { clause: '', params: [] as string[] };
        }

        return {
          clause: `AND (
            NOT EXISTS (
              SELECT 1
              FROM catalog_ecosystem_visibility_policies p
              WHERE UPPER(p.ecosystem_manager_id) = UPPER($2)
                AND p.item_type = '${itemType}'
                AND p.visibility_mode = 'allowlist'
            )
            OR EXISTS (
              SELECT 1
              FROM catalog_ecosystem_visibility_items vi
              WHERE UPPER(vi.ecosystem_manager_id) = UPPER($2)
                AND vi.item_type = '${itemType}'
                AND UPPER(vi.item_code) = UPPER(${itemCodeExpression})
            )
          )`,
          params: [ecosystemManagerId],
        };
      };

      const productCodeFilter = isTest
        ? `(p.product_id ILIKE $1
            OR COALESCE(p.metadata->>'ecosystemManagerId', '') ILIKE $1
            OR COALESCE(p.metadata->>'requesterId', '') ILIKE $1
            OR COALESCE(p.metadata->>'requestedBy', '') ILIKE $1
            OR COALESCE(p.metadata->>'createdBy', '') ILIKE $1)`
        : `(p.product_id NOT ILIKE $1
            AND COALESCE(p.metadata->>'ecosystemManagerId', '') NOT ILIKE $1
            AND COALESCE(p.metadata->>'requesterId', '') NOT ILIKE $1
            AND COALESCE(p.metadata->>'requestedBy', '') NOT ILIKE $1
            AND COALESCE(p.metadata->>'createdBy', '') NOT ILIKE $1)`;
      const serviceCodeFilter = isTest
        ? `(s.service_id ILIKE $1
            OR COALESCE(s.metadata->>'ecosystemManagerId', '') ILIKE $1
            OR COALESCE(s.metadata->>'requesterId', '') ILIKE $1
            OR COALESCE(s.metadata->>'requestedBy', '') ILIKE $1
            OR COALESCE(s.metadata->>'createdBy', '') ILIKE $1)`
        : `(s.service_id NOT ILIKE $1
            AND COALESCE(s.metadata->>'ecosystemManagerId', '') NOT ILIKE $1
            AND COALESCE(s.metadata->>'requesterId', '') NOT ILIKE $1
            AND COALESCE(s.metadata->>'requestedBy', '') NOT ILIKE $1
            AND COALESCE(s.metadata->>'createdBy', '') NOT ILIKE $1)`;
      const productVisibility = buildCatalogVisibilityClause('product', 'p.product_id');
      const serviceVisibility = buildCatalogVisibilityClause('service', 's.service_id');

      const [productCats, serviceCats] = await Promise.all([
        query<{ item_code: string; category: string | null }>(
          `SELECT
             p.product_id AS item_code,
             COALESCE(
               NULLIF(BTRIM(p.category), ''),
               NULLIF(BTRIM(p.metadata->>'category'), '')
             ) AS category
           FROM catalog_products p
           WHERE COALESCE(p.is_active, TRUE) = TRUE
             AND ${productCodeFilter}
             ${productVisibility.clause}`,
          ['%-TEST%', ...productVisibility.params],
        ),
        query<{ item_code: string; category: string | null }>(
          `SELECT
             s.service_id AS item_code,
             COALESCE(
               NULLIF(BTRIM(s.category), ''),
               NULLIF(BTRIM(s.metadata->>'category'), '')
             ) AS category
           FROM catalog_services s
           WHERE COALESCE(s.is_active, TRUE) = TRUE
             AND ${serviceCodeFilter}
             ${serviceVisibility.clause}`,
          ['%-TEST%', ...serviceVisibility.params],
        ),
      ]);

      const productCategories = Array.from(
        new Set(
          productCats.rows
            .map((row) => canonicalizeCatalogCategory('product', row.category, row.item_code))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b));

      const serviceCategories = Array.from(
        new Set(
          serviceCats.rows
            .map((row) => canonicalizeCatalogCategory('service', row.category, row.item_code))
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b));

      reply.send({
        success: true,
        data: {
          products: productCategories,
          services: serviceCategories,
        },
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch catalog categories');
      reply.code(500).send({ error: 'Failed to fetch categories' });
    }
  });

  // ── Create catalog product ──────────────────────────────────────────
  // POST /api/catalog/products
  // Allowed: admin, warehouse
  server.post('/api/catalog/products', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const role = (account.role ?? '').trim().toLowerCase();
    if (role !== 'admin' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins and warehouse users can create products' });
      return;
    }

    const bodySchema = z.object({
      name: z.string().trim().min(1, 'Name is required'),
      ecosystemManagerId: z.string().trim().min(1, 'Ecosystem is required'),
      description: z.string().trim().optional(),
      category: z.string().trim().optional(),
      unitOfMeasure: z.string().trim().optional(),
      basePrice: z.string().trim().optional(),
      sku: z.string().trim().optional(),
      packageSize: z.string().trim().optional(),
      leadTimeDays: z.coerce.number().int().optional(),
      reorderPoint: z.coerce.number().int().optional(),
    });

    const b = bodySchema.safeParse(request.body);
    if (!b.success) {
      reply.code(400).send({ error: b.error.issues[0]?.message || 'Invalid request' });
      return;
    }

    const {
      name,
      ecosystemManagerId: requestedEcosystemManagerId,
      description,
      category,
      unitOfMeasure,
      basePrice,
      sku,
      packageSize,
      leadTimeDays,
      reorderPoint,
    } = b.data;

    try {
      // Auto-generate next product ID (PRD-XXX)
      const maxResult = await query<{ max_num: string | null }>(
        `SELECT MAX(CAST(SUBSTRING(product_id FROM 5) AS INTEGER)) AS max_num
         FROM catalog_products
         WHERE product_id ~ '^PRD-[0-9]+$'`,
        [],
      );
      const nextNum = (Number(maxResult.rows[0]?.max_num) || 0) + 1;
      const productId = `PRD-${String(nextNum).padStart(3, '0')}`;

      const actorId = account.cksCode || role.toUpperCase();
      const selectedEcosystemManagerId = requestedEcosystemManagerId.trim().toUpperCase();

      const ecosystemExists = await query<{ exists: number }>(
        `SELECT 1 AS exists
         FROM managers
         WHERE UPPER(manager_id) = UPPER($1)
         LIMIT 1`,
        [selectedEcosystemManagerId],
      );
      let ecosystemIsAllowed = ecosystemExists.rowCount > 0;
      if (!ecosystemIsAllowed && role === 'warehouse') {
        const warehouseId = (account.cksCode ?? '').trim().toUpperCase();
        if (warehouseId) {
          ecosystemIsAllowed = await isWarehouseEcosystemAllowed(warehouseId, selectedEcosystemManagerId);
        }
      }
      if (!ecosystemIsAllowed) {
        reply.code(400).send({
          error: role === 'warehouse'
            ? `Ecosystem not available to warehouse: ${selectedEcosystemManagerId}`
            : `Ecosystem not found: ${selectedEcosystemManagerId}`,
        });
        return;
      }

      const ecosystemManagerId: string | null = selectedEcosystemManagerId;

      const productMetadata = {
        createdBy: account.cksCode || null,
        createdByRole: role,
        ecosystemManagerId,
        approvalStages: [
          {
            role,
            status: 'requested',
            label: role === 'warehouse' ? 'Warehouse Created' : 'Created',
            user: account.cksCode || null,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await query(
        `INSERT INTO catalog_products (
          product_id, name, description, category, unit_of_measure,
          base_price, sku, package_size, lead_time_days, reorder_point,
          metadata, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, TRUE, NOW(), NOW())`,
        [
          productId, name, description || null, category || null,
          unitOfMeasure || null, basePrice || null, sku || null,
          packageSize || null, leadTimeDays ?? null, reorderPoint ?? null,
          JSON.stringify(productMetadata),
        ],
      );

      await ensureEcosystemAllowlistItem(
        'product',
        productId,
        ecosystemManagerId,
        actorId,
      );

      // Record activity
      await recordActivity({
        activityType: 'product_created',
        description: `${role === 'warehouse' ? 'Warehouse Created Product' : 'New product'} ${productId} "${name}"`,
        actorId,
        actorRole: role,
        targetId: productId,
        targetType: 'product',
        metadata: {
          productId,
          name,
          category: category || null,
          createdBy: account.cksCode,
          createdByRole: role,
          ecosystemManagerId,
          approvalStages: productMetadata.approvalStages,
        },
      });

      reply.send({
        success: true,
        data: { productId, name, category: category || null, ecosystemManagerId },
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to create catalog product');
      reply.code(500).send({ error: 'Failed to create product' });
    }
  });

  // ── Create catalog service ──────────────────────────────────────────
  // POST /api/catalog/services
  // Allowed: admin, manager, warehouse (manager/warehouse require admin approval)
  server.post('/api/catalog/services', async (request, reply) => {
    const account = await requireActiveRole(request, reply, {});
    if (!account) return;

    const role = (account.role ?? '').trim().toLowerCase();
    if (role !== 'admin' && role !== 'manager' && role !== 'warehouse') {
      reply.code(403).send({ error: 'Only admins, managers, and warehouses can create services' });
      return;
    }

    const bodySchema = z.object({
      name: z.string().trim().min(1, 'Name is required'),
      ecosystemManagerId: z.string().trim().optional(),
      description: z.string().trim().optional(),
      category: z.string().trim().optional(),
      unitOfMeasure: z.string().trim().optional(),
      basePrice: z.string().trim().optional(),
      durationMinutes: z.coerce.number().int().optional(),
      serviceWindow: z.string().trim().optional(),
      crewRequired: z.coerce.number().int().optional(),
    });

    const b = bodySchema.safeParse(request.body);
    if (!b.success) {
      reply.code(400).send({ error: b.error.issues[0]?.message || 'Invalid request' });
      return;
    }

    const {
      name,
      ecosystemManagerId: requestedEcosystemManagerId,
      description,
      category,
      unitOfMeasure,
      basePrice,
      durationMinutes,
      serviceWindow,
      crewRequired,
    } = b.data;

    try {
      const normalizedName = name.trim();
      const normalizedCategory = (category || '').trim();
      const actorId = account.cksCode || role.toUpperCase();

      if (role !== 'admin') {
        const requesterId = (account.cksCode ?? '').trim().toUpperCase();
        if (!requesterId) {
          reply.code(403).send({ error: `${role} account is missing a valid code` });
          return;
        }
        if (!normalizedCategory) {
          reply.code(400).send({ error: 'Category is required for service requests' });
          return;
        }

        let ecosystemManagerId = role === 'manager'
          ? requesterId
          : (requestedEcosystemManagerId || '').trim().toUpperCase();
        let requesterName: string | null = null;
        let managedBy: 'manager' | 'warehouse' = role === 'warehouse' ? 'warehouse' : 'manager';

        if (role === 'warehouse') {
          const warehouseContext = await resolveWarehouseContext(requesterId);
          requesterName = warehouseContext.warehouseName;
          if (!ecosystemManagerId) {
            ecosystemManagerId = (warehouseContext.managerId || '').trim().toUpperCase();
          }
          if (!ecosystemManagerId) {
            reply.code(400).send({ error: 'Select an ecosystem before requesting services' });
            return;
          }
          const ecosystemExists = await query<{ exists: number }>(
            `SELECT 1 AS exists
             FROM managers
             WHERE UPPER(manager_id) = UPPER($1)
             LIMIT 1`,
            [ecosystemManagerId],
          );
          let ecosystemIsAllowed = ecosystemExists.rowCount > 0;
          if (!ecosystemIsAllowed) {
            ecosystemIsAllowed = await isWarehouseEcosystemAllowed(requesterId, ecosystemManagerId);
          }
          if (!ecosystemIsAllowed) {
            reply.code(400).send({ error: `Ecosystem not available to warehouse: ${ecosystemManagerId}` });
            return;
          }
        }

        const existingService = await query<{ service_id: string }>(
          `SELECT service_id
           FROM catalog_services
           WHERE UPPER(name) = UPPER($1)
             AND COALESCE(UPPER(category), '') = COALESCE(UPPER($2), '')
             AND is_active = TRUE
           LIMIT 1`,
          [normalizedName, normalizedCategory || null],
        );
        if (existingService.rowCount > 0) {
          reply.code(409).send({
            error: `Service already exists in catalog (${existingService.rows[0].service_id})`,
          });
          return;
        }

        const existingRequest = await query<{ request_id: string }>(
          `SELECT request_id
           FROM catalog_service_requests
           WHERE UPPER(manager_id) = UPPER($1)
             AND UPPER(service_name) = UPPER($2)
             AND COALESCE(UPPER(category), '') = COALESCE(UPPER($3), '')
             AND LOWER(COALESCE(metadata->>'requesterRole', 'manager')) = LOWER($4)
             AND UPPER(COALESCE(metadata->>'requesterId', manager_id)) = UPPER($5)
             AND status = 'pending'
           LIMIT 1`,
          [ecosystemManagerId, normalizedName, normalizedCategory || null, role, requesterId],
        );
        if (existingRequest.rowCount > 0) {
          reply.code(409).send({
            error: `A pending request already exists (${existingRequest.rows[0].request_id})`,
          });
          return;
        }

        const requestSeq = await query<{ next_num: string }>(
          `SELECT LPAD(nextval('catalog_service_request_sequence')::text, 6, '0') AS next_num`,
          [],
        );
        const requestId = `CSR-${requestSeq.rows[0]?.next_num ?? '000001'}`;

        await query(
          `INSERT INTO catalog_service_requests (
            request_id, manager_id, service_name, description, category, unit_of_measure,
            base_price, duration_minutes, service_window, crew_required, metadata, requested_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())`,
          [
            requestId,
            ecosystemManagerId,
            normalizedName,
            description || null,
            normalizedCategory,
            unitOfMeasure || null,
            basePrice || null,
            durationMinutes ?? null,
            serviceWindow || null,
            crewRequired ?? null,
            JSON.stringify({
              requestedBy: requesterId,
              requesterId,
              requesterRole: role,
              requesterName: requesterName || null,
              ecosystemManagerId,
              managedBy,
              approvalStages: buildServiceRequestApprovalStages(
                'pending',
                role === 'warehouse' ? 'warehouse' : 'manager',
                requesterName,
                requesterId,
              ),
            }),
          ],
        );

        await recordActivity({
          activityType: 'catalog_service_request_submitted',
          description: `${role === 'warehouse' ? 'Warehouse Requested Service' : 'Manager Requested Service'}: "${normalizedName}"`,
          actorId,
          actorRole: role,
          targetId: requestId,
          // system_activity.target_type is VARCHAR(20); catalogServiceRequest exceeds it
          targetType: 'catalogService',
          metadata: {
            requestId,
            managerId: ecosystemManagerId,
            requesterId,
            requesterRole: role,
            requesterName: requesterName || null,
            managedBy,
            serviceName: normalizedName,
            category: normalizedCategory || null,
            approvalStages: buildServiceRequestApprovalStages(
              'pending',
              role === 'warehouse' ? 'warehouse' : 'manager',
              requesterName,
              requesterId,
            ),
            targetType: 'catalogServiceRequest',
          },
        });

        reply.send({
          success: true,
          data: {
            requestId,
            status: 'pending_approval',
            name: normalizedName,
            category: normalizedCategory || null,
          },
        });
        return;
      }

      // Admin path: create the service immediately.
      const maxResult = await query<{ max_num: string | null }>(
        `SELECT MAX(CAST(SUBSTRING(service_id FROM 5) AS INTEGER)) AS max_num
         FROM catalog_services
         WHERE service_id ~ '^SRV-[0-9]+$'`,
        [],
      );
      const nextNum = (Number(maxResult.rows[0]?.max_num) || 0) + 1;
      const serviceId = `SRV-${String(nextNum).padStart(3, '0')}`;

      await query(
        `INSERT INTO catalog_services (
          service_id, name, description, category, unit_of_measure,
          base_price, duration_minutes, service_window, crew_required,
          metadata, managed_by, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, 'manager', TRUE, NOW(), NOW())`,
        [
          serviceId, normalizedName, description || null, normalizedCategory || null,
          unitOfMeasure || null, basePrice || null,
          durationMinutes ?? null, serviceWindow || null, crewRequired ?? null,
          JSON.stringify({
            createdBy: account.cksCode || 'ADMIN',
            createdByRole: 'admin',
            managedBy: 'manager',
            approvalStages: [
              {
                role: 'admin',
                status: 'approved',
                label: 'Created',
                user: account.cksCode || 'ADMIN',
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        ],
      );

      await ensureAllowlistItemForAllEcosystems(
        'service',
        serviceId,
        actorId,
      );

      await recordActivity({
        activityType: 'catalog_service_created',
        description: `New service ${serviceId} "${normalizedName}" created`,
        actorId,
        actorRole: role,
        targetId: serviceId,
        targetType: 'catalogService',
        metadata: { serviceId, name: normalizedName, category: normalizedCategory || null, createdBy: account.cksCode },
      });

      reply.send({
        success: true,
        data: {
          serviceId,
          status: 'created',
          name: normalizedName,
          category: normalizedCategory || null,
        },
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to create catalog service');
      reply.code(500).send({ error: 'Failed to create service' });
    }
  });
}
