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
  | 'user'
  | 'product'
  | 'warehouse'
  | 'center'
  | 'crew'
  | 'contractor'
  | 'manager'
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
}

/**
 * Entity Adapter - Contract for all entity types
 *
 * Each entity type must provide an adapter that implements:
 * 1. What actions are available (based on role + permissions) - PURE function
 * 2. Which modal component to render
 * 3. How to map data to modal props
 *
 * IMPORTANT: Adapters must be PURE - no hooks, no side effects
 * Data fetching is handled by ModalGateway calling hooks at top level
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
   * The modal component to render
   */
  Component: React.ComponentType<TModalProps>;

  /**
   * Maps fetched data to modal props
   */
  mapToProps: (data: TData | null, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => TModalProps;
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
