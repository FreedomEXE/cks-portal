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
}

export function parseEntityId(id: string | null | undefined): ParsedEntityId {
  if (!id) {
    return { type: 'unknown', id: '' };
  }

  const normalizedId = id.trim().toUpperCase();

  // Order IDs: contain -PO- (product order) or -SO- (service order)
  if (normalizedId.includes('-PO-')) {
    return { type: 'order', id, subtype: 'product' };
  }
  if (normalizedId.includes('-SO-')) {
    return { type: 'order', id, subtype: 'service' };
  }

  // Service IDs: SRV-###
  if (normalizedId.startsWith('SRV-')) {
    return { type: 'service', id };
  }

  // Report IDs: RPT-### or ###-RPT-###
  if (normalizedId.includes('-RPT-') || normalizedId.startsWith('RPT-')) {
    return { type: 'report', id, subtype: 'report' };
  }

  // Feedback IDs: FBK-### or ###-FBK-###
  if (normalizedId.includes('-FBK-') || normalizedId.startsWith('FBK-')) {
    return { type: 'report', id, subtype: 'feedback' };
  }

  // Procedure IDs: PRO-###
  if (normalizedId.startsWith('PRO-')) {
    return { type: 'procedure', id };
  }

  // Training IDs: TRN-###
  if (normalizedId.startsWith('TRN-')) {
    return { type: 'training', id };
  }

  // Product Catalog IDs: PROD-###
  if (normalizedId.startsWith('PROD-')) {
    return { type: 'product', id };
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
        return { type: 'user', id };
      }
    }
  }

  // Fallback: unknown type
  return { type: 'unknown', id };
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
