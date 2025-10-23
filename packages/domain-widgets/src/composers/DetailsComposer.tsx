/**
 * DetailsComposer - Universal Details Tab Renderer
 *
 * THE ONLY details renderer. Takes section descriptors and renders them
 * using the section registry. Applies RBAC filtering at the section level.
 *
 * Philosophy:
 * - ONE composer for all entities
 * - Sections are composable primitives
 * - RBAC filters sections before render
 * - Adapters define structure via section descriptors
 */

import React from 'react';
import {
  SectionDescriptor,
  FieldListSection,
  KeyValueGridSection,
  ItemsTableSection,
  ContactInfoSection,
  AvailabilitySection,
  RichTextSection,
  NotesSection,
} from '@cks/ui';

/**
 * Section Registry - Maps section types to components
 */
const sectionRegistry: Record<string, React.ComponentType<any>> = {
  'field-list': FieldListSection,
  'key-value-grid': KeyValueGridSection,
  'items-table': ItemsTableSection,
  'contact-info': ContactInfoSection,
  'availability': AvailabilitySection,
  'rich-text': RichTextSection,
  'notes': NotesSection,
};

export interface DetailsComposerProps {
  /** Section descriptors (data-only) */
  sections: SectionDescriptor[];

  /** Optional: Filter function for RBAC (default: show all) */
  filterSection?: (section: SectionDescriptor) => boolean;
}

/**
 * DetailsComposer - Renders sections from descriptors
 *
 * Usage:
 * ```tsx
 * <DetailsComposer
 *   sections={[
 *     { id: 'items', type: 'items-table', title: 'Products', columns: [...], rows: [...] },
 *     { id: 'requestor', type: 'contact-info', title: 'Requestor', contact: {...} },
 *   ]}
 *   filterSection={(section) => canSeeSection(entityType, section.id, role, lifecycle)}
 * />
 * ```
 */
export function DetailsComposer({ sections, filterSection }: DetailsComposerProps) {
  // Apply RBAC filtering if provided
  const visibleSections = filterSection ? sections.filter(filterSection) : sections;

  return (
    <div style={{ padding: '16px' }}>
      {visibleSections.map((section) => {
        const SectionComponent = sectionRegistry[section.type];

        if (!SectionComponent) {
          console.warn(`[DetailsComposer] Unknown section type: ${section.type}`);
          return null;
        }

        // Render section component with descriptor props
        return <SectionComponent key={section.id} {...section} />;
      })}

      {visibleSections.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
          No details available
        </div>
      )}
    </div>
  );
}

export default DetailsComposer;
