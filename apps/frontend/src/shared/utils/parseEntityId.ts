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
  type: 'order' | 'service' | 'report' | 'user' | 'procedure' | 'training' | 'product' | 'unknown';
  id: string;
  subtype?: 'product' | 'service' | 'report' | 'feedback';
  scope?: string; // e.g., "CON-010" from "CON-010-FBK-001"
}

export function parseEntityId(id: string | null | undefined): ParsedEntityId {
  if (!id) {
    return { type: 'unknown', id: '' };
  }

  const normalizedId = id.trim().toUpperCase();
  const scope = extractScope(id);

  // Order IDs: contain -PO- (product order) or -SO- (service order)
  if (normalizedId.includes('-PO-')) {
    return { type: 'order', id, subtype: 'product', scope };
  }
  if (normalizedId.includes('-SO-')) {
    return { type: 'order', id, subtype: 'service', scope };
  }

  // Service IDs: SRV-###
  if (normalizedId.startsWith('SRV-')) {
    return { type: 'service', id, scope };
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
  const userPrefixes = ['MGR-', 'CON-', 'CUS-', 'CEN-', 'CRW-', 'WAR-', 'ADM-'];
  for (const prefix of userPrefixes) {
    if (normalizedId.startsWith(prefix)) {
      // Make sure it's not an order/report (those have additional segments)
      const segments = normalizedId.split('-');
      // User IDs are exactly 2 segments: PREFIX-NUMBER
      // Orders are 4+ segments: PREFIX-NUMBER-TYPE-NUMBER
      if (segments.length === 2) {
        return { type: 'user', id, scope };
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

  // Pattern 1: Simple entity ID (SRV-001, PRO-055, etc.)
  // Pattern 2: User ID (CON-010, MGR-005, etc.)
  // Pattern 3: Complex entity ID (CON-010-FBK-001, MGR-005-SO-023, etc.)
  const patterns = [
    /^[A-Z]+-\d+$/,                    // Simple or user
    /^[A-Z]+-\d+-[A-Z]+-\d+$/,        // Complex entity
  ];

  return patterns.some(pattern => pattern.test(normalizedId));
}
