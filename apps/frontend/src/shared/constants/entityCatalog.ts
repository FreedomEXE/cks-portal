/**
 * Entity Catalog - Single Source of Truth (Frontend)
 *
 * This catalog defines ALL entity metadata in one place.
 * Every entity type (order, report, service, etc.) is defined here with:
 * - ID patterns and tokens
 * - Backend table mappings
 * - Endpoint configurations
 * - Capability flags
 * - UI/Modal settings
 * - Activity type keys
 *
 * IMPORTANT: Keep synchronized with backend catalog at:
 * apps/backend/server/shared/entityCatalog.ts
 *
 * DO NOT import backend code into frontend or vice versa.
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

  // Backend mapping
  backendTable: string;            // 'orders', 'reports', 'services'
  backendIdColumn: string;         // 'order_id', 'report_id', 'service_id'

  // Frontend endpoints
  detailsEndpoint?: (id: string) => string;  // id => '/api/order/ORD-123/details'

  // Capability flags (prevent calling non-existent endpoints)
  supportsDetailFetch: boolean;    // Details endpoint exists?
  supportsArchive: boolean;        // Can be archived?
  supportsDelete: boolean;         // Can be hard-deleted?
  supportsRestore: boolean;        // Can be restored?
  supportsHistory: boolean;        // Has history timeline?
  supportsTombstone: boolean;      // Can retrieve deleted snapshot?

  // UI/Modal
  modalComponent: string;          // 'ActivityModal', 'ReportModal', etc.
  defaultTabOrder: string[];       // ['details', 'history', 'actions']

  // Activity types (must match backend event writers exactly)
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
    // Use SINGULAR per backend convention
    detailsEndpoint: (id) => `/api/order/${id}/details`,
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    modalComponent: 'ActivityModal',
    defaultTabOrder: ['actions', 'details', 'history'],
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
    detailsEndpoint: (id) => `/api/reports/${id}/details`,
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    modalComponent: 'ReportModal',
    defaultTabOrder: ['details', 'history', 'actions'],
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
    detailsEndpoint: (id) => `/api/reports/${id}/details`,
    supportsDetailFetch: true,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: true,
    modalComponent: 'ReportModal',
    defaultTabOrder: ['details', 'history', 'actions'],
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
    idToken: 'SRV',  // Canonical (not SVC)
    idPattern: /^SRV-\d+$/i,
    backendTable: 'services',
    backendIdColumn: 'service_id',
    detailsEndpoint: (id) => `/api/services/${id}/details`,
    supportsDetailFetch: false,  // PENDING: Gated by SERVICE_DETAIL_FETCH flag
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: true,
    supportsTombstone: false,  // Enable after detail endpoint lands
    modalComponent: 'ServiceDetailsModal',
    defaultTabOrder: ['details', 'history', 'actions'],
    activityTypes: {
      created: 'service_created',
      archived: 'service_archived',
      restored: 'service_restored',
      deleted: 'service_hard_deleted'
    }
  },

  product: {
    type: 'product',
    displayName: 'Product',
    displayNamePlural: 'Products',
    idToken: ['PROD', 'PRD'],  // Both variants + padded backend format
    // Pattern: Handles PROD-123 and PRD-00000123 (padded)
    idPattern: /^PRO?D-\d{1,8}$/i,
    backendTable: 'product_catalog',
    backendIdColumn: 'product_id',
    detailsEndpoint: undefined,  // TODO: Endpoint pending
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'ProductModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'UserModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'UserModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'UserModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'LocationModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'CrewModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: true,
    supportsDelete: true,
    supportsRestore: true,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'WarehouseModal',
    defaultTabOrder: ['details', 'actions'],
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
    detailsEndpoint: undefined,
    supportsDetailFetch: false,
    supportsArchive: false,
    supportsDelete: false,
    supportsRestore: false,
    supportsHistory: false,
    supportsTombstone: false,
    modalComponent: 'GenericModal',
    defaultTabOrder: ['details'],
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
 */
export function getEntityByIdPattern(id: string): EntityDefinition {
  // Try each pattern (excluding unknown)
  const match = Object.values(ENTITY_CATALOG)
    .filter(def => def.type !== 'unknown')
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
