/**
 * Section Types - Data descriptors for Details tab sections
 *
 * These are pure data structures that describe what to render.
 * Section components are presentational - they take props and render.
 */

import { ReactNode } from 'react';

/**
 * Base section descriptor
 */
export interface BaseSectionDescriptor {
  id: string;
  title?: string;
  type: string;
}

/**
 * Field list section - vertical label/value pairs
 */
export interface FieldListSectionDescriptor extends BaseSectionDescriptor {
  type: 'field-list';
  fields: Array<{
    label: string;
    value: string | ReactNode;
  }>;
}

/**
 * Key-value grid section - 2-4 column grid
 */
export interface KeyValueGridSectionDescriptor extends BaseSectionDescriptor {
  type: 'key-value-grid';
  columns?: 2 | 3 | 4; // Default 2
  fields: Array<{
    label: string;
    value: string | ReactNode;
  }>;
}

/**
 * Items table section - table with columns and rows
 */
export interface ItemsTableSectionDescriptor extends BaseSectionDescriptor {
  type: 'items-table';
  columns: Array<{
    key: string;
    label: string;
  }>;
  rows: Array<Record<string, string | number | ReactNode>>;
}

/**
 * Contact info section - name/address/phone/email
 */
export interface ContactInfoSectionDescriptor extends BaseSectionDescriptor {
  type: 'contact-info';
  contact: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

/**
 * Availability section - timezone/days/window
 */
export interface AvailabilitySectionDescriptor extends BaseSectionDescriptor {
  type: 'availability';
  availability: {
    tz?: string | null;
    days?: string[];
    window?: { start: string; end: string } | null;
  };
}

/**
 * Rich text section - markdown or plain text
 */
export interface RichTextSectionDescriptor extends BaseSectionDescriptor {
  type: 'rich-text';
  content: string;
  markdown?: boolean; // Default false
}

/**
 * Notes section - text with optional metadata
 */
export interface NotesSectionDescriptor extends BaseSectionDescriptor {
  type: 'notes';
  content: string;
  author?: string;
  timestamp?: string;
}

/**
 * Map section - iframe embed for static tracking
 */
export interface MapSectionDescriptor extends BaseSectionDescriptor {
  type: 'map';
  mapUrl: string;
  mapLink?: string;
  caption?: string;
  height?: number;
}

/**
 * Union of all section descriptors
 */
export type SectionDescriptor =
  | FieldListSectionDescriptor
  | KeyValueGridSectionDescriptor
  | ItemsTableSectionDescriptor
  | ContactInfoSectionDescriptor
  | AvailabilitySectionDescriptor
  | RichTextSectionDescriptor
  | NotesSectionDescriptor
  | MapSectionDescriptor;
