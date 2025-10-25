/**
 * Entity Accent Color Resolution
 *
 * Centralized color mapping for entity types.
 * Used for:
 * - Header accent bars
 * - Active tab underlines
 * - Status indicators
 */

export type EntityType =
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse'
  | 'order'
  | 'service'
  | 'report'
  | 'feedback'
  | 'product';

/**
 * Get the accent color for an entity type
 *
 * @param entityType - The entity type (manager, contractor, order, etc.)
 * @returns Hex color string
 */
export function getEntityAccentColor(entityType: string): string {
  const colorMap: Record<string, string> = {
    // Users
    manager: '#3b82f6',     // Blue
    contractor: '#10b981',  // Green
    customer: '#eab308',    // Yellow
    center: '#f97316',      // Orange
    crew: '#ef4444',        // Red
    warehouse: '#8b5cf6',   // Purple

    // Transactions
    order: '#3b82f6',       // Blue (matches manager)

    // Services & Reports
    service: '#0ea5e9',     // Cyan
    report: '#8b5cf6',      // Purple
    feedback: '#8b5cf6',    // Purple

    // Products
    product: '#10b981',     // Green (matches contractor)
  };

  return colorMap[entityType] || '#6366f1'; // Fallback indigo
}
