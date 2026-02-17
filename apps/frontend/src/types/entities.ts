/**
 * Entity Types & Adapter Interface
 *
 * Defines the contract for all entity types in the modal system.
 * Each entity (order, report, service, user, etc.) must provide an adapter
 * that conforms to this interface.
 */


/**
 * All supported entity types in the system
 */
export type EntityType =
  | 'order'
  | 'report'
  | 'feedback'
  | 'service'
  | 'catalogService' // Catalog service definitions (SRV-XXX unscoped)
  | 'user'
  | 'product'
  | 'warehouse'
  | 'center'
  | 'crew'
  | 'contractor'
  | 'manager'
  | 'admin'
  | 'customer';

/**
 * Entity lifecycle states
 */
export type EntityState = 'active' | 'archived' | 'deleted';

/**
 * Complete lifecycle metadata for an entity
 *
 * Contains all information about entity's lifecycle state
 * including archive and deletion metadata.
 */
export interface Lifecycle {
  /** Current lifecycle state */
  state: EntityState;

  // Archive metadata (when state === 'archived')
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  scheduledDeletion?: string;

  // Deletion metadata (when state === 'deleted')
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;  // True if loaded from snapshot
}

/**
 * Tab identifiers for entity modals
 */
export type TabId =
  | 'details'
  | 'history'
  | 'actions'
  | 'quick-actions'
  | 'actions_removed'
  | 'management'
  | 'profile'
  | 'participants'
  | 'crew'
  | 'products'
  | 'procedures'
  | 'training'
  | 'notes'
  | 'overview'
  | 'audit';

/**
 * Context for determining tab visibility
 */
export interface TabVisibilityContext {
  role: UserRole;
  lifecycle: Lifecycle;
  entityType: EntityType;
  entityData?: any;
  entityId?: string; // The ID of the entity being viewed
  viewerId?: string; // The ID of the current user viewing
  hasActions: boolean;
  /** Optional open context passed from modal launcher (e.g., focus flags) */
  openContext?: Record<string, any>;
}

/**
 * Tab descriptor - defines a single tab in an entity modal
 */
export interface TabDescriptor {
  id: TabId;
  label: string;
  content: React.ReactNode;
}

/**
 * Header field - a single metadata field in the entity header
 */
export interface HeaderField {
  label: string;
  value: string | React.ReactNode;
}

/**
 * Header configuration - data-only description of entity header
 *
 * This is a pure data structure that describes what to show in the header.
 * EntityHeader component renders this configuration.
 */
export interface HeaderConfig {
  /** Entity ID (e.g., "PO-001", "CEN-010-RPT-001") */
  id: string;

  /** Type label (e.g., "Product Order", "Feedback", "Service") */
  type?: string;

  /** Status value for StatusBadge */
  status: string;

  /** Optional custom status text override */
  statusText?: string;

  /** Metadata fields to display */
  fields: HeaderField[];

  /** Optional badges (priority, rating, etc.) */
  badges?: React.ReactNode[];
}

/**
 * Role types for permission checking
 */
export type UserRole =
  | 'admin'
  | 'manager'
  | 'contractor'
  | 'customer'
  | 'center'
  | 'crew'
  | 'warehouse';

/**
 * Action Descriptor - Pure data describing what action is available
 *
 * This is a pure data structure with NO hooks, NO handlers, just declarative specs.
 * ModalGateway will bind these descriptors to actual handlers.
 */
export interface EntityActionDescriptor {
  /** Unique action key (e.g., 'archive', 'accept', 'delete') */
  key: string;

  /** Display label for the action button */
  label: string;

  /** Button visual variant */
  variant: 'primary' | 'secondary' | 'danger';

  /** Optional confirmation prompt before executing */
  confirm?: string;

  /** Optional input prompt to collect user input (e.g., reason) */
  prompt?: string;

  /** Additional payload to send with the action */
  payload?: Record<string, unknown>;

  /** Whether the action button should be disabled */
  disabled?: boolean;

  /** Whether to close modal on successful action (default: true) */
  closeOnSuccess?: boolean;
}

/**
 * Fully wired action with handler (created by ModalGateway)
 *
 * This extends the descriptor with actual onClick handler.
 */
export interface EntityAction extends Omit<EntityActionDescriptor, 'key' | 'confirm' | 'prompt' | 'closeOnSuccess'> {
  /** Click handler wired up by ModalGateway */
  onClick: () => void | Promise<void>;

  /** Loading state for async actions */
  loading?: boolean;
}

/**
 * Context for building entity actions
 */
export interface EntityActionContext {
  role: UserRole;
  state: EntityState;
  entityId: string;
  entityType: EntityType;
  entityData?: any;
  viewerId?: string; // ID of the current user viewing (for ownership checks)
}

/**
 * Section Descriptor (imported from @cks/ui)
 *
 * Re-export for convenience in adapters.
 * The actual type is defined in @cks/ui/sections
 */
export type { SectionDescriptor } from '@cks/ui';

/**
 * Entity Adapter - Contract for all entity types
 *
 * Each entity type must provide an adapter that implements:
 * 1. What actions are available (based on role + permissions) - PURE function
 * 2. What the header summary looks like - PURE function
 * 3. What tabs are available for this entity - PURE function
 * 4. What sections compose the Details tab - PURE function (Phase 7)
 *
 * IMPORTANT: Adapters must be PURE - no hooks, no side effects
 * Data fetching is handled by ModalGateway calling hooks at top level
 *
 * NEW PATTERN (Phase 7 - Universal Details Composition):
 * - getHeaderConfig: Returns data config for EntityHeader
 * - getDetailsSections: Returns section descriptors for DetailsComposer
 * - getTabDescriptors: Returns tab descriptors (Details tab uses DetailsComposer)
 * - No Component or mapToProps needed (EntityModalView is the universal shell)
 *
 * LEGACY PATTERN (Deprecated, for backward compat):
 * - Component: Wrapper modal component
 * - mapToProps: Props mapping
 */
export interface EntityAdapter<TData = any, TModalProps = any> {
  /**
   * Returns pure action descriptors based on context
   *
   * MUST BE A PURE FUNCTION - No hooks allowed!
   * This is where role-based permissions are applied via pure `can()` checks.
   */
  getActionDescriptors: (context: EntityActionContext) => EntityActionDescriptor[];

  /**
   * Returns header configuration (data-only)
   *
   * MUST BE A PURE FUNCTION - No hooks allowed!
   * Returns a data configuration for the universal EntityHeader component.
   * No JSX - just data describing what to show.
   */
  getHeaderConfig: (context: TabVisibilityContext) => HeaderConfig;

  /**
   * Returns section descriptors for Details tab (Phase 7)
   *
   * MUST BE A PURE FUNCTION - No hooks allowed!
   * Returns ordered list of section descriptors that compose the Details tab.
   * DetailsComposer will render these using section primitives.
   * Section visibility filtering happens via section policy.
   */
  getDetailsSections: (context: TabVisibilityContext) => import('@cks/ui').SectionDescriptor[];

  /**
   * @deprecated Legacy - use getHeaderConfig instead
   * Returns header summary (the "card" region)
   */
  getHeader?: (context: TabVisibilityContext) => React.ReactNode;

  /**
   * Returns base tab descriptors for this entity type
   *
   * MUST BE A PURE FUNCTION - No hooks allowed!
   * Returns all possible tabs for this entity. Visibility filtering happens in policy layer.
   */
  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]) => TabDescriptor[];

  /**
   * @deprecated Legacy - use getHeader + getTabDescriptors instead
   * The modal component to render
   */
  Component?: React.ComponentType<TModalProps>;

  /**
   * @deprecated Legacy - use getHeader + getTabDescriptors instead
   * Maps fetched data to modal props
   */
  mapToProps?: (data: TData | null, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => TModalProps;
}

/**
 * Entity Registry - Maps entity types to their adapters
 */
export type EntityRegistry = {
  [K in EntityType]?: EntityAdapter;
};

/**
 * Options for opening entity modals
 */
export interface OpenEntityModalOptions {
  /** Override automatic state detection */
  state?: EntityState;
  /** Additional context for action building */
  context?: Record<string, any>;
  /** Callback after modal closes */
  onClosed?: () => void;
}
