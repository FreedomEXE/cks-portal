/**
 * Entity Registry - Maps entity types to their modal adapters
 *
 * This is the single source of truth for how each entity type behaves in modals.
 * To add a new entity type, simply add its adapter here.
 *
 * Pattern:
 * 1. Create use*Details hook (called by ModalGateway)
 * 2. Define buildActions logic in adapter
 * 3. Add entry to registry
 * 4. Done! Works everywhere (activity feed, directory, archive, etc.)
 *
 * Note: Data fetching is handled by ModalGateway calling hooks directly.
 * Adapters only define action building and prop mapping logic.
 */

import type {
  EntityAdapter,
  EntityRegistry,
  EntityActionContext,
  EntityAction,
  EntityActionDescriptor,
} from '../types/entities';
import { can } from '../policies/permissions';
import { ActivityModal, ReportModal, ServiceDetailsModal } from '@cks/ui';
import type { ActivityModalProps } from '@cks/ui';

/**
 * Order Adapter
 */
const orderAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData } = context;
    const descriptors: EntityActionDescriptor[] = [];

    // Admin actions
    if (role === 'admin') {
      if (state === 'active') {
        if (can('order', 'archive', role, { state, entityData })) {
          descriptors.push({
            key: 'archive',
            label: 'Archive Order',
            variant: 'secondary',
            prompt: 'Optional: Provide a reason for archiving this order',
            closeOnSuccess: true,
          });
        }
      } else if (state === 'archived') {
        if (can('order', 'restore', role, { state, entityData })) {
          descriptors.push({
            key: 'restore',
            label: 'Restore Order',
            variant: 'secondary',
            closeOnSuccess: true,
          });
        }
        if (can('order', 'delete', role, { state, entityData })) {
          descriptors.push({
            key: 'delete',
            label: 'Permanently Delete Order',
            variant: 'danger',
            confirm: 'Are you sure you want to PERMANENTLY delete this order? This cannot be undone.',
            prompt: 'Provide a deletion reason (optional):',
            closeOnSuccess: true,
          });
        }
      }
    }

    // User workflow actions (accept, reject, create_service, etc.)
    // These come from backend via entityData.availableActions
    if (role !== 'admin' && state === 'active') {
      const availableActions = entityData?.availableActions || [];
      const actionLabels = availableActions.filter((label: string) =>
        label && label.toLowerCase() !== 'view details'
      );

      for (const label of actionLabels) {
        const key = label.toLowerCase().replace(/\s+/g, '_');

        // Determine variant based on action type
        const variant: 'primary' | 'secondary' | 'danger' =
          /accept|approve|create service/i.test(label) ? 'primary' :
          /reject|decline|cancel/i.test(label) ? 'danger' : 'secondary';

        // Add confirmation for destructive actions
        const confirm = /reject|decline|cancel/i.test(label)
          ? `Are you sure you want to ${label.toLowerCase()} this order?`
          : undefined;

        // Add prompt for actions that need a reason
        const prompt = /reject|decline/i.test(label)
          ? `Please provide a reason for ${label.toLowerCase()}:`
          : undefined;

        descriptors.push({
          key,
          label,
          variant,
          confirm,
          prompt,
          closeOnSuccess: true,
        });
      }
    }

    return descriptors;
  },

  Component: ActivityModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void): ActivityModalProps => {
    return {
      isOpen: !!data,
      onClose,
      role: 'admin', // Will be overridden by ModalGateway
      order: data,
      actions,
      defaultExpanded: false,
      // Additional order-specific props will be passed by ModalGateway
    };
  },
};

/**
 * Report/Feedback Adapter
 */
const reportAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData } = context;
    const descriptors: EntityActionDescriptor[] = [];

    const reportType = entityData?.type || 'report';
    const reportLabel = reportType === 'feedback' ? 'Feedback' : 'Report';

    // Admin actions
    if (role === 'admin') {
      if (state === 'active') {
        if (can(reportType, 'archive', role, { state, entityData })) {
          descriptors.push({
            key: 'archive',
            label: `Archive ${reportLabel}`,
            variant: 'secondary',
            prompt: `Optional: Provide a reason for archiving this ${reportLabel.toLowerCase()}`,
            closeOnSuccess: true,
          });
        }
      } else if (state === 'archived') {
        if (can(reportType, 'restore', role, { state, entityData })) {
          descriptors.push({
            key: 'restore',
            label: `Restore ${reportLabel}`,
            variant: 'secondary',
            closeOnSuccess: true,
          });
        }
        if (can(reportType, 'delete', role, { state, entityData })) {
          descriptors.push({
            key: 'delete',
            label: `Permanently Delete ${reportLabel}`,
            variant: 'danger',
            confirm: `Are you sure you want to PERMANENTLY delete this ${reportLabel.toLowerCase()}? This cannot be undone.`,
            prompt: 'Provide a deletion reason (optional):',
            closeOnSuccess: true,
          });
        }
      }
    }

    // User workflow actions (acknowledge, resolve, close)
    if (role !== 'admin' && state === 'active') {
      const status = entityData?.status;

      if (can(reportType, 'acknowledge', role, { state, entityData }) && status === 'open') {
        descriptors.push({
          key: 'acknowledge',
          label: 'Acknowledge',
          variant: 'primary',
          closeOnSuccess: false, // Keep modal open after acknowledging
        });
      }

      if (can(reportType, 'resolve', role, { state, entityData }) && status === 'open') {
        descriptors.push({
          key: 'resolve',
          label: 'Resolve',
          variant: 'primary',
          closeOnSuccess: false,
        });
      }

      if (can(reportType, 'close', role, { state, entityData }) && status === 'resolved') {
        descriptors.push({
          key: 'close',
          label: 'Close',
          variant: 'secondary',
          closeOnSuccess: true,
        });
      }
    }

    return descriptors;
  },

  Component: ReportModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void) => {
    return {
      isOpen: !!data,
      onClose,
      report: data,
      actions,
      currentUser: undefined, // Will be set by ModalGateway
      showQuickActions: true,
    };
  },
};

/**
 * Service Adapter
 */
const serviceAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData } = context;
    const descriptors: EntityActionDescriptor[] = [];

    // Admin actions
    if (role === 'admin') {
      if (state === 'active') {
        if (can('service', 'archive', role, { state, entityData })) {
          descriptors.push({
            key: 'archive',
            label: 'Archive Service',
            variant: 'secondary',
            prompt: 'Optional: Provide a reason for archiving this service',
            closeOnSuccess: true,
          });
        }
      } else if (state === 'archived') {
        if (can('service', 'restore', role, { state, entityData })) {
          descriptors.push({
            key: 'restore',
            label: 'Restore Service',
            variant: 'secondary',
            closeOnSuccess: true,
          });
        }
        if (can('service', 'delete', role, { state, entityData })) {
          descriptors.push({
            key: 'delete',
            label: 'Permanently Delete Service',
            variant: 'danger',
            confirm: 'Are you sure you want to PERMANENTLY delete this service? This cannot be undone.',
            prompt: 'Provide a deletion reason (optional):',
            closeOnSuccess: true,
          });
        }
      }
    }

    // User workflow actions (start, complete, assign crew)
    if (role !== 'admin' && state === 'active') {
      const status = entityData?.status;

      if (can('service', 'start', role, { state, entityData }) && status === 'pending') {
        descriptors.push({
          key: 'start',
          label: 'Start Service',
          variant: 'primary',
          closeOnSuccess: false, // Keep modal open to see updated status
        });
      }

      if (can('service', 'complete', role, { state, entityData }) && status === 'in_progress') {
        descriptors.push({
          key: 'complete',
          label: 'Complete Service',
          variant: 'primary',
          closeOnSuccess: true,
        });
      }

      if (can('service', 'assign_crew', role, { state, entityData })) {
        descriptors.push({
          key: 'assign_crew',
          label: 'Assign Crew',
          variant: 'secondary',
          closeOnSuccess: false,
        });
      }
    }

    return descriptors;
  },

  Component: ServiceDetailsModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void) => {
    return {
      isOpen: !!data,
      onClose,
      service: data,
      actions,
      editable: false, // Will be determined by ModalGateway based on role
    };
  },
};

/**
 * Entity Registry - Add new entity types here
 */
export const entityRegistry: EntityRegistry = {
  order: orderAdapter,
  report: reportAdapter,
  feedback: reportAdapter, // Feedback uses same adapter as report
  service: serviceAdapter,
};
