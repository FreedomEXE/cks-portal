// @cks/policies - Central policy registry for role-based permissions

export {
  POLICY_VERSION
} from './types';

export type {
  HubRole,
  OrderType,
  OrderStatus,
  ProductOrderStatus,
  ServiceOrderStatus,
  OrderAction,
  OrderContext,
  OrderParticipant,
  PolicyDecision
} from './types';

export {
  // Core policy functions
  getVisibleStatuses,
  getAllowedActions,
  getNextStatus,
  canTransition,

  // Helper functions
  isFinalStatus,
  isCompletedStatus,

  // UI helpers
  getActionLabel,
  getStatusLabel,
  getStatusColor,

  // Validation
  validatePolicyVersion
} from './orderPolicy';