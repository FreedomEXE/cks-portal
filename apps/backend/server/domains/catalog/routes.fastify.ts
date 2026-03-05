import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActiveRole } from '../../core/auth/guards';
import { requireActiveAdmin } from '../adminUsers/guards';
import { query, withTransaction } from '../../db/connection';
import { getCatalogItems } from './service';
import { isCatalogItemVisible } from './store';
import { recordActivity } from '../activity/writer';

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
      const result = await query<{ ecosystem_id: string; ecosystem_name: string | null }>(
        `SELECT manager_id AS ecosystem_id, name AS ecosystem_name
         FROM managers
         WHERE status = 'active'
         ORDER BY name ASC`,
        [],
      );
      reply.send({
        success: true,
        data: result.rows.map((row) => ({
          ecosystemId: row.ecosystem_id,
          ecosystemName: row.ecosystem_name,
        })),
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch ecosystem list');
      reply.code(500).send({ error: 'Failed to fetch ecosystem list' });
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

      // Build response data
      const data: any = {
        serviceId: row.service_id,
        name: row.name,
        category: row.category,
        description: row.description,
        tags: row.tags || [],
        status: row.is_active ? 'active' : 'inactive',
        metadata: row.metadata || {},
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
        createdAt: row.created_at?.toISOString(),
        updatedAt: row.updated_at?.toISOString()
      };

      // Determine lifecycle state and metadata (root-level for ModalProvider)
      const svcState: 'active' | 'archived' = row.is_active ? 'active' : 'archived';
      const archivedAt = row.archived_at ? row.archived_at.toISOString() : undefined;
      const archivedBy = row.archived_by || undefined;
      const deletionScheduled = row.deletion_scheduled ? row.deletion_scheduled.toISOString() : undefined;

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
          category: product.category,
          unitOfMeasure: product.unit_of_measure,
          status: state, // Keep in data for backward compat
          metadata: product.metadata,
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

  // Admin: update catalog service metadata/fields
  server.patch('/api/admin/catalog/services/:serviceId', async (request, reply) => {
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) {
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

    const { serviceId } = p.data;
    const { name, category, description, imageUrl, tags, isActive, metadata } = b.data;

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
         WHERE service_id = $${params.length}`;
      console.log('[CATALOG] Executing SQL:', sql);
      console.log('[CATALOG] With params:', params);

      await query(sql, params);

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
    const admin = await requireActiveAdmin(request, reply);
    if (!admin) return;

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
}
