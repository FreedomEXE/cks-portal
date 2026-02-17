/**
 * Parse Entity ID - Determines entity type from ID format
 *
 * This is the foundation of the unified EntityModal architecture.
 * IDs follow consistent patterns that tell us what type of entity we're dealing with.
 *
 * Examples:
 * - CRW-006-PO-110 → order (product)
 * - MGR-005-SO-023 → order (service)
 * - SRV-001 → service
 * - RPT-017 or CRW-006-RPT-003 → report
 * - FBK-025 or CEN-010-FBK-012 → feedback
 * - CON-010 → user (contractor)
 * - MGR-005 → user (manager)
 * - PRO-055 → procedure (future)
 * - TRN-088 → training (future)
 */

export interface ParsedEntityId {
  type: 'order' | 'service' | 'catalogService' | 'report' | 'user' | 'procedure' | 'training' | 'product' | 'unknown';
  id: string;
  subtype?: 'product' | 'service' | 'report' | 'feedback' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  scope?: string; // e.g., "CON-010" from "CON-010-FBK-001"
}

export function parseEntityId(id: string | null | undefined): ParsedEntityId {
  if (!id) {
    return { type: 'unknown', id: '' };
  }

  const normalizedId = id.trim().toUpperCase();
  const scope = extractScope(id);
  const segments = normalizedId.split('-');

  // Order IDs: contain -PO- (product order) or -SO- (service order)
  if (normalizedId.includes('-PO-')) {
    return { type: 'order', id, subtype: 'product', scope };
  }
  if (normalizedId.includes('-SO-')) {
    return { type: 'order', id, subtype: 'service', scope };
  }

  // Service IDs: SRV-###
  // Distinguish between catalog services (unscoped) and active services (scoped)
  if (normalizedId.includes('SRV-')) {
    // Check if scoped (has prefix like CEN-010-)
    const hasScope = /^[A-Z]{3}-\d{3}-/.test(normalizedId);

    if (hasScope) {
      // Scoped = active service instance (e.g., CEN-010-SRV-001)
      return { type: 'service', id, scope };
    } else {
      // Unscoped = catalog service definition (e.g., SRV-001)
      return { type: 'catalogService', id, scope };
    }
  }

  // Report IDs: RPT-### or ###-RPT-###
  if (normalizedId.includes('-RPT-') || normalizedId.startsWith('RPT-')) {
    return { type: 'report', id, subtype: 'report', scope };
  }

  // Feedback IDs: FBK-### or ###-FBK-###
  if (normalizedId.includes('-FBK-') || normalizedId.startsWith('FBK-')) {
    return { type: 'report', id, subtype: 'feedback', scope };
  }

  // Procedure IDs: PRO-###
  if (normalizedId.startsWith('PRO-')) {
    return { type: 'procedure', id, scope };
  }

  // Training IDs: TRN-###
  if (normalizedId.startsWith('TRN-')) {
    return { type: 'training', id, scope };
  }

  // Product Catalog IDs: PRD-### (NOT PROD)
  // NOTE: Product ORDERS use PO- token and are handled above
  if (normalizedId.startsWith('PRD-')) {
    return { type: 'product', id, scope };
  }

  // User IDs: Role prefix followed by number
  // Map prefix to subtype for concrete entity type resolution
  const userPrefixMap: Record<string, 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse'> = {
    'MGR-': 'manager',
    'CON-': 'contractor',
    'CUS-': 'customer',
    'CEN-': 'center',
    'CRW-': 'crew',
    'WAR-': 'warehouse',
    'WHS-': 'warehouse', // Support both WAR and WHS prefixes
  };

  for (const [prefix, subtype] of Object.entries(userPrefixMap)) {
    if (normalizedId.startsWith(prefix)) {
      const hasNestedEntityToken = segments.some((segment, index) => {
        if (index < 2) {
          return false;
        }
        return segment === 'PO' ||
          segment === 'SO' ||
          segment === 'RPT' ||
          segment === 'FBK' ||
          segment === 'SRV' ||
          segment === 'PRO' ||
          segment === 'TRN' ||
          segment === 'PRD';
      });

      if (!hasNestedEntityToken) {
        return { type: 'user', id, subtype, scope };
      }
    }
  }

  // Fallback: unknown type
  return { type: 'unknown', id, scope };
}

/**
 * Get human-readable entity type name
 */
export function getEntityTypeName(type: ParsedEntityId['type']): string {
  const names: Record<ParsedEntityId['type'], string> = {
    order: 'Order',
    service: 'Service',
    catalogService: 'Service',
    report: 'Report/Feedback',
    user: 'User',
    procedure: 'Procedure',
    training: 'Training',
    product: 'Product',
    unknown: 'Unknown'
  };
  return names[type] || 'Unknown';
}

/**
 * Check if entity type supports actions
 */
export function supportsActions(type: ParsedEntityId['type']): boolean {
  return ['order', 'service', 'report'].includes(type);
}

/**
 * Extract scope (hub/user identifier) from entity ID
 *
 * Examples:
 * - "CON-010-FBK-001" → "CON-010"
 * - "MGR-005-SO-023" → "MGR-005"
 * - "CEN-010-RPT-017" → "CEN-010"
 * - "MGR-005" → "MGR-005" (user ID)
 * - "SRV-001" → null (service has no owner scope)
 *
 * @param id - The entity ID to parse
 * @returns The scope string or null if no scope found
 */
export function extractScope(id: string | null | undefined): string | undefined {
  if (!id) return undefined;

  const normalizedId = id.trim().toUpperCase();

  // Pattern: PREFIX-NUMBER (first two segments)
  // Matches: CON-010, MGR-005, CEN-010, etc.
  const match = normalizedId.match(/^([A-Z]+-\d+)(?:-|$)/);

  return match ? match[1] : undefined;
}

/**
 * Validate entity ID format
 *
 * Checks if the ID matches expected patterns:
 * - User: PREFIX-NUMBER (e.g., "CON-010")
 * - Entity: PREFIX-NUMBER-TYPE-NUMBER (e.g., "CON-010-FBK-001")
 * - Simple: TYPE-NUMBER (e.g., "SRV-001", "PRO-055")
 *
 * @param id - The entity ID to validate
 * @returns true if ID matches a valid pattern
 */
export function isValidId(id: string | null | undefined): boolean {
  if (!id) return false;

  const normalizedId = id.trim().toUpperCase();
  const segments = normalizedId.split('-');
  const hasUserPrefix =
    normalizedId.startsWith('MGR-') ||
    normalizedId.startsWith('CON-') ||
    normalizedId.startsWith('CUS-') ||
    normalizedId.startsWith('CEN-') ||
    normalizedId.startsWith('CRW-') ||
    normalizedId.startsWith('WAR-') ||
    normalizedId.startsWith('WHS-');

  if (hasUserPrefix) {
    const hasNestedEntityToken = segments.some((segment, index) => {
      if (index < 2) {
        return false;
      }
      return segment === 'PO' ||
        segment === 'SO' ||
        segment === 'RPT' ||
        segment === 'FBK' ||
        segment === 'SRV' ||
        segment === 'PRO' ||
        segment === 'TRN' ||
        segment === 'PRD';
    });

    if (!hasNestedEntityToken) {
      return true;
    }
  }

  // Pattern 1: Simple entity ID (SRV-001, PRO-055, etc.)
  // Pattern 2: User ID (CON-010, MGR-005, etc.)
  // Pattern 3: Complex entity ID (CON-010-FBK-001, MGR-005-SO-023, etc.)
  const patterns = [
    /^[A-Z]+-\d+(?:-TEST)?$/,                    // Simple or user (with optional -TEST)
    /^[A-Z]+-\d+(?:-TEST)?-[A-Z]+-\d+(?:-TEST)?$/, // Complex entity (allow -TEST after scope or suffix)
    /^[A-Z]+-TEST-\d+$/,                         // Test-first simple (e.g., SRV-TEST-001)
    /^[A-Z]+-\d+-TEST$/,                         // Test suffix without extra segments (e.g., SRV-001-TEST)
  ];

  return patterns.some(pattern => pattern.test(normalizedId));
}
