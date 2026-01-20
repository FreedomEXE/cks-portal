/**
 * Section Visibility Policy - RBAC for Detail Sections
 *
 * Central authority for determining which sections users can see.
 * Applied by DetailsComposer before rendering.
 *
 * Philosophy:
 * - Centralized permission logic (no business logic in components)
 * - Role-based + lifecycle-aware
 * - Entity-type specific rules when needed
 */

import type { EntityType, UserRole, Lifecycle } from '../types/entities';

/**
 * Section IDs for different entity types
 */
export type SectionId =
  // Common sections
  | 'items'
  | 'requestor-info'
  | 'destination-info'
  | 'availability'
  | 'notes'
  | 'special-instructions'
  | 'delivery-map'
  | 'cancellation-reason'
  | 'rejection-reason'
  | 'fulfilled-by'
  | 'related-service'
  // Report sections
  | 'report-summary'
  | 'description'
  | 'attachments'
  // Catalog Service sections
  | 'service-info'
  | 'additional-details'
  | 'pricing'
  // Service sections
  | 'service-overview'
  | 'crew-assignments'
  | 'procedures'
  | 'training'
  | 'schedule';

export interface SectionVisibilityContext {
  entityType: EntityType;
  role: UserRole;
  lifecycle: Lifecycle;
  entityData?: any;
}

/**
 * Determines if a section should be visible to the user
 *
 * @param sectionId - ID of the section to check
 * @param context - User role, lifecycle, entity type, etc.
 * @returns true if section should be visible
 */
export function canSeeSection(
  sectionId: SectionId,
  context: SectionVisibilityContext
): boolean {
  const { entityType, role, lifecycle, entityData } = context;

  // Global rules: Everyone can see basic info sections
  switch (sectionId) {
    case 'requestor-info':
    case 'destination-info':
    case 'delivery-map':
    case 'notes':
    case 'special-instructions':
    case 'description':
      return true;

    case 'items':
    case 'availability':
      return true;

    case 'cancellation-reason':
      return entityData?.status === 'cancelled';

    case 'rejection-reason':
      return entityData?.status === 'rejected';

    case 'fulfilled-by':
      return entityData?.fulfilledById != null;

    case 'related-service':
      return entityData?.serviceId != null;

    // Report-specific sections
    case 'report-summary':
      return entityType === 'report' || entityType === 'feedback';

    case 'attachments':
      return entityData?.attachments && entityData.attachments.length > 0;

    // Catalog Service-specific sections
    case 'service-info':
    case 'additional-details':
    case 'pricing':
      return entityType === 'catalogService';

    // Service-specific sections (restricted)
    case 'service-overview':
      return entityType === 'service';

    case 'crew-assignments':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor')
      );

    case 'procedures':
    case 'training':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor' || role === 'crew')
      );

    case 'schedule':
      return (
        entityType === 'service' &&
        (role === 'admin' || role === 'manager' || role === 'contractor' || role === 'crew')
      );

    default:
      // Unknown sections are hidden by default (fail-safe)
      console.warn(`[Section Policy] Unknown section ID: ${sectionId}`);
      return false;
  }
}

/**
 * Filter sections based on visibility policy
 *
 * Helper function for adapters to filter sections.
 */
export function filterVisibleSections<T extends { id: string }>(
  sections: T[],
  context: SectionVisibilityContext
): T[] {
  return sections.filter((section) =>
    canSeeSection(section.id as SectionId, context)
  );
}
