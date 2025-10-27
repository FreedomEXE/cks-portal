/**
 * Entity Catalog - Single Source of Truth (Backend)
 *
 * This catalog defines ALL entity metadata for backend operations.
 * Every entity type (order, report, service, etc.) is defined here with:
 * - Database table mappings
 * - ID patterns for validation
 * - Capability flags for lifecycle operations
 * - Activity type keys for event logging
 *
 * IMPORTANT: Keep synchronized with frontend catalog at:
 * apps/frontend/src/shared/constants/entityCatalog.ts
 *
 * DO NOT import frontend code into backend or vice versa.
 */

export interface EntityDefinition {
  // Core identity
  type: string;                    // 'order', 'report', 'service', etc.
  displayName: string;             // "Order" (proper case)
  displayNamePlural: string;       // "Orders"

  // ID patterns (anchored, case-insensitive where needed)
  idToken: string | string[];      // "RPT" or ["SO", "PO"]
  idPattern: RegExp;               // /^(?:[A-Z]{3}-\d{3}-)?RPT-\d+$/i
  scopePrefix?: string;            // "MGR-", "CON-", etc. (for user entities)

  // Database mapping
  backendTable: string;            // 'orders', 'reports', 'services'
  backendIdColumn: string;         // 'order_id', 'report_id', 'service_id'

  // Capability flags (control what operations are allowed)
  supportsDetailFetch: boolean;    // Details endpoint exists?
  supportsArchive: boolean;        // Can be archived?
  supportsDelete: boolean;         // Can be hard-deleted?
  supportsRestore: boolean;        // Can be restored?
  supportsHistory: boolean;        // Has history timeline?
  supportsTombstone: boolean;      // Can retrieve deleted snapshot?

  // Activity types (must match activity log event writers exactly)
  activityTypes: {
    created: string;
    archived: string;
    restored: string;
    deleted: string;
  };
}

export const ENTITY_CATALOG: Record<string, EntityDefinition> = {

  order: {
    type: 'order',
    displayName: 'Order',
    displayNamePlural: 'Orders',
    idToken: ['SO', 'PO'],
    // Pattern: Optional scope (CEN-010-), required token (SO/PO), required number
    idPattern: /^(?:[A-Z]{3}-\d{3}-)?(?:S|P)O-\d+$/i,
    backendTable: 'orders',
    backendIdColumn: 'order_id',
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    activityTypes: {
      created: 'order_created',
      archived: 'order_archived',
      restored: 'order_restored',
      deleted: 'order_hard_deleted'
    }
  },

  report: {
    type: 'report',
    displayName: 'Report',
    displayNamePlural: 'Reports',
    idToken: 'RPT',
    // Pattern: Optional scope, required RPT token
    idPattern: /^(?:[A-Z]{3}-\d{3}-)?RPT-\d+$/i,
    backendTable: 'reports',
    backendIdColumn: 'report_id',
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    activityTypes: {
      created: 'report_created',
      archived: 'report_archived',
      restored: 'report_restored',
      deleted: 'report_hard_deleted'
    }
  },

  feedback: {
    type: 'feedback',
    displayName: 'Feedback',
    displayNamePlural: 'Feedback',
    idToken: 'FBK',
    idPattern: /^(?:[A-Z]{3}-\d{3}-)?FBK-\d+$/i,
    backendTable: 'reports',  // Same table as reports
    backendIdColumn: 'report_id',
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    activityTypes: {
      created: 'feedback_created',
      archived: 'feedback_archived',
      restored: 'feedback_restored',
      deleted: 'feedback_hard_deleted'
    }
  },

  service: {
    type: 'service',
    displayName: 'Service',
    displayNamePlural: 'Services',
    idToken: 'SRV',  // Active service instances (scoped)
    // Pattern: Scoped IDs only (CEN-010-SRV-001)
    // Active services created from service orders via transformation
    idPattern: /^(?:[A-Z]{3}-\d{3}-)SRV-\d+$/i,
    backendTable: 'services',
    backendIdColumn: 'service_id',
    supportsDetailFetch: false,  // PENDING: Gated by SERVICE_DETAIL_FETCH flag
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: false,  // Enable after detail endpoint lands
    activityTypes: {
      created: 'service_created',
      archived: 'service_archived',
      restored: 'service_restored',
      deleted: 'service_hard_deleted'
    }
  },

  catalogService: {
    type: 'catalogService',
    displayName: 'Service Definition',
    displayNamePlural: 'Service Definitions',
    idToken: 'SRV',  // Catalog service definitions (unscoped)
    // Pattern: Unscoped SRV-### only (catalog definitions)
    idPattern: /^SRV-\d+$/i,
    backendTable: 'catalog_services',
    backendIdColumn: 'service_id',
    supportsDetailFetch: true,  // ✅ Endpoint: /api/catalog/services/:serviceId/details
    supportsArchive: true,      // ✅ Uses is_active flag instead of archived_at
    supportsDelete: true,       // ✅ Can be hard-deleted
    supportsRestore: true,      // ✅ Can restore archived services
    supportsHistory: true,      // ✅ Tracks lifecycle + certification events
    supportsTombstone: true,    // ✅ Deletion snapshots stored in activity log
    activityTypes: {
      created: 'catalog_service_created',
      archived: 'catalog_service_archived',
      restored: 'catalog_service_restored',
      deleted: 'catalog_service_deleted'
    }
  },

  product: {
    type: 'product',
    displayName: 'Product',
    displayNamePlural: 'Products',
    idToken: 'PRD',  // Product catalog items (NOT product orders - those use 'PO')
    // Pattern: Handles PRD-123 and PRD-00000123 (padded format)
    idPattern: /^PRD-\d{1,8}$/i,
    backendTable: 'product_catalog',
    backendIdColumn: 'product_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    activityTypes: {
      created: 'product_created',
      archived: 'product_archived',
      restored: 'product_restored',
      deleted: 'product_hard_deleted'
    }
  },

  manager: {
    type: 'manager',
    displayName: 'Manager',
    displayNamePlural: 'Managers',
    idToken: 'MGR',
    idPattern: /^MGR-\d+$/i,
    scopePrefix: 'MGR-',
    backendTable: 'managers',
    backendIdColumn: 'manager_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'manager_created',
      archived: 'manager_archived',
      restored: 'manager_restored',
      deleted: 'manager_hard_deleted'
    }
  },

  contractor: {
    type: 'contractor',
    displayName: 'Contractor',
    displayNamePlural: 'Contractors',
    idToken: 'CON',
    idPattern: /^CON-\d+$/i,
    scopePrefix: 'CON-',
    backendTable: 'contractors',
    backendIdColumn: 'contractor_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'contractor_created',
      archived: 'contractor_archived',
      restored: 'contractor_restored',
      deleted: 'contractor_hard_deleted'
    }
  },

  customer: {
    type: 'customer',
    displayName: 'Customer',
    displayNamePlural: 'Customers',
    idToken: 'CUS',
    idPattern: /^CUS-\d+$/i,
    scopePrefix: 'CUS-',
    backendTable: 'customers',
    backendIdColumn: 'customer_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'customer_created',
      archived: 'customer_archived',
      restored: 'customer_restored',
      deleted: 'customer_hard_deleted'
    }
  },

  center: {
    type: 'center',
    displayName: 'Center',
    displayNamePlural: 'Centers',
    idToken: 'CEN',
    idPattern: /^CEN-\d+$/i,
    scopePrefix: 'CEN-',
    backendTable: 'centers',
    backendIdColumn: 'center_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'center_created',
      archived: 'center_archived',
      restored: 'center_restored',
      deleted: 'center_hard_deleted'
    }
  },

  crew: {
    type: 'crew',
    displayName: 'Crew',
    displayNamePlural: 'Crews',
    idToken: 'CRW',
    idPattern: /^CRW-\d+$/i,
    scopePrefix: 'CRW-',
    backendTable: 'crews',
    backendIdColumn: 'crew_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'crew_created',
      archived: 'crew_archived',
      restored: 'crew_restored',
      deleted: 'crew_hard_deleted'
    }
  },

  warehouse: {
    type: 'warehouse',
    displayName: 'Warehouse',
    displayNamePlural: 'Warehouses',
    idToken: 'WAR',
    idPattern: /^WAR-\d+$/i,
    scopePrefix: 'WAR-',
    backendTable: 'warehouses',
    backendIdColumn: 'warehouse_id',
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,  // ✅ Enabled for user modal History tab
    supportsTombstone: false,
    activityTypes: {
      created: 'warehouse_created',
      archived: 'warehouse_archived',
      restored: 'warehouse_restored',
      deleted: 'warehouse_hard_deleted'
    }
  },

  // FALLBACK: Unknown entity type (graceful degradation)
  unknown: {
    type: 'unknown',
    displayName: 'Unknown Entity',
    displayNamePlural: 'Unknown Entities',
    idToken: '',
    idPattern: /.*/,  // Matches anything
    backendTable: '',
    backendIdColumn: '',
    supportsDetailFetch: false,
    supportsArchive: false,
    supportsDelete: false,
    supportsRestore: false,
    supportsHistory: false,
    supportsTombstone: false,
    activityTypes: {
      created: 'unknown_created',
      archived: 'unknown_archived',
      restored: 'unknown_restored',
      deleted: 'unknown_deleted'
    }
  }

};

// ===== HELPER FUNCTIONS =====

/**
 * Get entity definition by type
 * Always returns a definition (uses 'unknown' fallback)
 */
export function getEntityDefinition(type: string): EntityDefinition {
  return ENTITY_CATALOG[type] || ENTITY_CATALOG.unknown;
}

/**
 * Find entity type by parsing ID pattern
 * Returns 'unknown' entity if no pattern matches
 *
 * Special handling for SRV token (service vs catalogService):
 * - Scoped (CEN-010-SRV-001) → service (active instance)
 * - Unscoped (SRV-123) → catalogService (catalog definition)
 */
export function getEntityByIdPattern(id: string): EntityDefinition {
  const normalizedId = id.toUpperCase();

  // Special case: SRV token needs disambiguation
  if (normalizedId.includes('SRV-')) {
    // Check if scoped (has prefix like CEN-010-)
    const hasScope = /^[A-Z]{3}-\d{3}-/.test(normalizedId);

    if (hasScope) {
      // Scoped = active service instance
      return ENTITY_CATALOG.service;
    } else {
      // Unscoped = catalog service definition
      return ENTITY_CATALOG.catalogService;
    }
  }

  // Try each pattern (excluding unknown and catalogService - handled above)
  const match = Object.values(ENTITY_CATALOG)
    .filter(def => def.type !== 'unknown' && def.type !== 'catalogService')
    .find(def => def.idPattern.test(id));

  if (!match) {
    // Log for analytics during rollout
    console.warn(`[EntityCatalog] Unknown ID pattern: "${id}"`);
  }

  return match || ENTITY_CATALOG.unknown;
}

/**
 * Get all entity types (excluding 'unknown')
 */
export function getAllEntityTypes(): string[] {
  return Object.keys(ENTITY_CATALOG).filter(type => type !== 'unknown');
}

/**
 * Check if entity supports a specific lifecycle action
 */
export function supportsLifecycleAction(
  type: string,
  action: 'archive' | 'delete' | 'restore' | 'detailFetch' | 'history' | 'tombstone'
): boolean {
  const def = getEntityDefinition(type);

  switch(action) {
    case 'archive': return def.supportsArchive;
    case 'delete': return def.supportsDelete;
    case 'restore': return def.supportsRestore;
    case 'detailFetch': return def.supportsDetailFetch;
    case 'history': return def.supportsHistory;
    case 'tombstone': return def.supportsTombstone;
    default: return false;
  }
}

/**
 * Validate entity ID and get type
 */
export function validateEntityId(id: string): { valid: boolean; type: string; reason?: string } {
  if (!id) {
    return {
      valid: false,
      type: 'unknown',
      reason: 'Empty ID'
    };
  }

  const def = getEntityByIdPattern(id);

  if (def.type === 'unknown') {
    return {
      valid: false,
      type: 'unknown',
      reason: 'ID does not match any known entity pattern'
    };
  }

  return { valid: true, type: def.type };
}

/**
 * Get database table and column names for an entity type
 */
export function getEntityTableMapping(type: string): { table: string; idColumn: string } {
  const def = getEntityDefinition(type);
  return {
    table: def.backendTable,
    idColumn: def.backendIdColumn
  };
}

/**
 * Get activity type key for a specific lifecycle event
 */
export function getActivityType(
  entityType: string,
  action: 'created' | 'archived' | 'restored' | 'deleted'
): string {
  const def = getEntityDefinition(entityType);
  return def.activityTypes[action];
}
