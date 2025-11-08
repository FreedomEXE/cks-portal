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

import React from 'react';
import toast from 'react-hot-toast';
import type {
  EntityAdapter,
  EntityRegistry,
  EntityActionContext,
  EntityAction,
  EntityActionDescriptor,
  Lifecycle,
  TabDescriptor,
  TabVisibilityContext,
  HeaderConfig,
  HeaderField,
} from '../types/entities';
import { can } from '../policies/permissions';
import {
  ActivityModal,
  ReportModal,
  ServiceDetailsModal,
  HistoryTab,
  OrderActionsContent,
  ReportQuickActions,
  UserModal,
  UserQuickActions,
  ServiceDetails,
  ServiceQuickActions,
} from '@cks/ui';
// Deep import for product quick actions (not exported at package root)
import { ProductQuickActions } from '@cks/ui';
import type { ActivityModalProps } from '@cks/ui';
import { DetailsComposer, ProfileInfoCard, getEntityAccentColor } from '@cks/domain-widgets';
import { filterVisibleSections } from '../policies/sections';
import { mapProfileDataForRole } from '../shared/utils/profileMapping';
import { patchServiceAssignments } from '../shared/api/admin';
import { updateInventory, getProductInventory } from '../shared/api/admin';
import ServiceAssignmentsTab from '../components/tabs/ServiceAssignmentsTab/ServiceAssignmentsTab';
import ServiceProceduresTab from '../components/tabs/ServiceProceduresTab/ServiceProceduresTab';
import ServiceProceduresViewerTab from '../components/tabs/ServiceProceduresTab/ServiceProceduresViewerTab';
import ServiceTrainingTab from '../components/tabs/ServiceTrainingTab/ServiceTrainingTab';
import ServiceProductsTab from '../components/tabs/ServiceProductsTab/ServiceProductsTab';
import ServiceTasksTab from '../components/tabs/ServiceTasksTab/ServiceTasksTab';
import ServiceCrewTasksTab from '../components/tabs/ServiceCrewTasksTab/ServiceCrewTasksTab';

/**
 * Order Details Sections Builder
 */
function buildOrderDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];
  const isProduct = entityData?.orderType === 'product';
  const isService = entityData?.orderType === 'service';

  // Related Service section (if linked to service)
  if (entityData?.serviceId) {
    sections.push({
      id: 'related-service',
      type: 'key-value-grid',
      title: 'Related Service',
      columns: 2,
      fields: [
        { label: 'Service ID', value: entityData.serviceId },
      ],
    });
  }

  // Fulfilled By section (if fulfilled)
  if (entityData?.fulfilledById || entityData?.fulfilledByName) {
    sections.push({
      id: 'fulfilled-by',
      type: 'key-value-grid',
      title: 'Fulfilled By',
      columns: 2,
      fields: [
        { label: 'ID', value: entityData.fulfilledById || '-' },
        { label: 'Name', value: entityData.fulfilledByName || '-' },
      ],
    });
  }

  // Requestor Information section
  if (entityData?.requestorInfo) {
    sections.push({
      id: 'requestor-info',
      type: 'contact-info',
      title: 'Requestor Information',
      contact: {
        name: entityData.requestedBy,
        address: entityData.requestorInfo.address,
        phone: entityData.requestorInfo.phone,
        email: entityData.requestorInfo.email,
      },
    });
  }

  // Delivery/Destination Information section
  if (entityData?.destinationInfo) {
    sections.push({
      id: 'destination-info',
      type: 'contact-info',
      title: 'Delivery Information',
      contact: {
        name: entityData.destination,
        address: entityData.destinationInfo.address,
        phone: entityData.destinationInfo.phone,
        email: entityData.destinationInfo.email,
      },
    });
  }

  // Availability section
  if (entityData?.availability) {
    sections.push({
      id: 'availability',
      type: 'availability',
      title: 'Availability',
      availability: {
        tz: entityData.availability.tz,
        days: entityData.availability.days,
        window: entityData.availability.window,
      },
    });
  }

  // Product Items table (for product orders)
  if (isProduct && entityData?.items && entityData.items.length > 0) {
    sections.push({
      id: 'items',
      type: 'items-table',
      title: 'Product Items',
      columns: [
        { key: 'code', label: 'Product Code' },
        { key: 'name', label: 'Product Name' },
        { key: 'description', label: 'Description' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unitOfMeasure', label: 'Unit' },
      ],
      rows: entityData.items.map((item: any) => ({
        code: item.code || '-',
        name: item.name,
        description: item.description || '-',
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure || 'EA',
      })),
    });
  }

  // Service Information (for service orders)
  if (isService) {
    const svc: any = (entityData as any)?.serviceDetails || (entityData as any)?.metadata || {};
    const firstServiceItem = Array.isArray((entityData as any)?.items)
      ? (entityData as any).items.find((it: any) => (it?.itemType || it?.item_type) === 'service')
      : null;

    const name = svc.serviceName || firstServiceItem?.name || null;
    const type = svc.serviceType || (firstServiceItem?.metadata?.serviceType ?? null);
    const status = svc.serviceStatus || null;
    const description = (svc.serviceDescription || firstServiceItem?.description || '').toString();
    const fields: Array<{ label: string; value: string }> = [];

    const serviceId = svc.serviceId || (entityData as any).serviceId || null;
    if (serviceId) fields.push({ label: 'Service ID', value: String(serviceId) });
    if (name) fields.push({ label: 'Name', value: String(name) });
    if (type) fields.push({ label: 'Type', value: String(type) });
    if (status) fields.push({ label: 'Status', value: String(status) });

    if (fields.length > 0) {
      sections.push({
        id: 'service-info',
        type: 'key-value-grid',
        title: 'Service Information',
        columns: 2,
        fields,
      });
    }
    if (description.trim().length > 0) {
      sections.push({
        id: 'service-description',
        type: 'rich-text',
        title: 'Service Description',
        content: description,
      } as any);
    }
  }

  // Special Instructions section
  if (entityData?.notes) {
    sections.push({
      id: 'special-instructions',
      type: 'rich-text',
      title: 'Special Instructions',
      content: entityData.notes,
    });
  }

  // Cancellation Reason section
  if (entityData?.status === 'cancelled' && entityData?.cancellationReason) {
    sections.push({
      id: 'cancellation-reason',
      type: 'notes',
      title: 'Cancellation Reason',
      content: entityData.cancellationReason,
      author: entityData.cancelledBy,
      timestamp: entityData.cancelledAt,
    });
  }

  // Rejection Reason section
  if (entityData?.status === 'rejected' && entityData?.rejectionReason) {
    sections.push({
      id: 'rejection-reason',
      type: 'notes',
      title: 'Rejection Reason',
      content: entityData.rejectionReason,
      author: entityData.rejectedBy,
      timestamp: entityData.rejectedAt,
    });
  }

  return sections;
}

/**
 * Normalize order status to canonical CSS-friendly keys
 * Maps specific order statuses to standard EntityHeaderCard CSS classes
 */
function normalizeOrderStatus(status: string | null | undefined): string {
  if (!status) return 'pending';
  const normalized = status.toLowerCase();

  // Pending statuses → 'pending'
  if (normalized.includes('pending')) return 'pending';

  // In-transit/delivery statuses → 'in_transit' (blue)
  if (normalized.includes('transit') || normalized.includes('delivery')) return 'in_transit';

  // Completion statuses → 'completed'
  if (normalized.includes('delivered') || normalized.includes('completed')) return 'completed';

  // Cancellation/rejection → 'cancelled'
  if (normalized.includes('cancelled') || normalized.includes('rejected')) return 'cancelled';

  // Archived → 'archived'
  if (normalized.includes('archived')) return 'archived';

  // Default
  return 'pending';
}

/**
 * Format status for human-readable display
 */
function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return 'PENDING';
  return status.toUpperCase().replace(/_/g, ' ');
}

/**
 * Order Adapter
 */
const orderAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData, viewerId } = context;
    const descriptors: EntityActionDescriptor[] = [];

    if (process.env.NODE_ENV !== 'production') {
      console.log('[OrderAdapter] getActionDescriptors called:', {
        role,
        state,
        viewerId,
        hasEntityData: !!entityData,
        status: entityData?.status,
        availableActions: entityData?.availableActions,
        metadata: entityData?.metadata,
      });
    }

    // Admin actions
    if (role === 'admin') {
      if (state === 'active') {
        if (can('order', 'archive', role, { state, entityData })) {
          descriptors.push({
            key: 'archive',
            label: 'Archive Order',
            variant: 'secondary',
            confirm: 'Are you sure you want to archive this order? You can restore it later.',
            prompt: 'Optional: Provide a reason for archiving this order',
            closeOnSuccess: true,
          });
        }

        // Convenience: manage the related active service directly from the order modal (admin only)
        if (entityData?.orderType === 'service' && entityData?.serviceId) {
          descriptors.push({
            key: 'archive_related_service',
            label: 'Archive Active Service',
            variant: 'secondary',
            confirm: `Archive related active service ${entityData.serviceId}? You can restore it later.`,
            prompt: 'Optional: Provide a reason for archiving this service',
            closeOnSuccess: false,
            payload: { relatedServiceId: entityData.serviceId },
          });
          descriptors.push({
            key: 'hard_delete_related_service',
            label: 'Permanently Delete Active Service',
            variant: 'danger',
            confirm: `Are you sure you want to PERMANENTLY delete active service ${entityData.serviceId}? This cannot be undone.`,
            prompt: 'Provide a deletion reason (optional):',
            closeOnSuccess: false,
            payload: { relatedServiceId: entityData.serviceId },
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

      // If backend provided actions, use them
      if (actionLabels.length > 0) {
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

          // Keep modal open for flow actions like "Create Service"
          const keepOpen = /create service/i.test(label);
          descriptors.push({
            key,
            label,
            variant,
            confirm,
            prompt,
            closeOnSuccess: keepOpen ? false : true,
          });
        }
      } else {
        // Fallback: Derive actions from RBAC policies with ownership checks
        const status = entityData?.status?.toLowerCase() || '';

        if (process.env.NODE_ENV !== 'production') {
          console.log('[OrderAdapter] RBAC fallback triggered - no backend actions:', {
            role,
            status,
            viewerId,
          });
        }

        // Creator can cancel their own order while pending next-actor approval
        if (status.includes('pending')) {
          const isCreator = entityData?.creatorId === viewerId;
          if (isCreator) {
            descriptors.push({
              key: 'cancel',
              label: 'Cancel',
              variant: 'danger',
              confirm: 'Are you sure you want to cancel this order?',
              prompt: 'Optional: Provide a reason for cancellation',
              closeOnSuccess: true,
            });
          }
        }

        // Warehouse can accept/reject if assigned and status is pending_warehouse
        if (role === 'warehouse' && status === 'pending_warehouse') {
          const warehouseAssigned =
            entityData?.fulfilledById === viewerId ||
            entityData?.assignedWarehouse === viewerId ||
            entityData?.metadata?.warehouseId === viewerId;

          if (process.env.NODE_ENV !== 'production') {
            console.log('[OrderAdapter] Warehouse accept/reject check:', {
              warehouseAssigned,
              fulfilledById: entityData?.fulfilledById,
              assignedWarehouse: entityData?.assignedWarehouse,
              metadata: entityData?.metadata,
            });
          }

          if (warehouseAssigned) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('[OrderAdapter] Adding warehouse accept/reject actions');
            }
            descriptors.push({
              key: 'accept',
              label: 'Accept',
              variant: 'primary',
              closeOnSuccess: false, // keep modal open to continue workflow
            });
            descriptors.push({
              key: 'reject',
              label: 'Reject',
              variant: 'danger',
              confirm: 'Are you sure you want to reject this order?',
              prompt: 'Please provide a reason for rejection:',
              closeOnSuccess: false,
            });
          }
        }

        // Warehouse delivery workflow (modal-centric)
        if (role === 'warehouse' && status === 'awaiting_delivery') {
          const warehouseAssigned =
            entityData?.fulfilledById === viewerId ||
            entityData?.assignedWarehouse === viewerId ||
            entityData?.metadata?.warehouseId === viewerId;

          if (warehouseAssigned) {
            const deliveryStarted = entityData?.metadata?.deliveryStarted === true;
            if (deliveryStarted) {
              // Already started → allow marking delivered
              descriptors.push({
                key: 'complete_delivery',
                label: 'Mark Delivered',
                variant: 'primary',
                closeOnSuccess: false,
              });
            } else {
              // Not yet started → allow starting
              descriptors.push({
                key: 'start_delivery',
                label: 'Start Delivery',
                variant: 'primary',
                closeOnSuccess: false,
              });
            }
            descriptors.push({
              key: 'cancel',
              label: 'Cancel',
              variant: 'danger',
              confirm: 'Are you sure you want to cancel this order?',
              prompt: 'Optional: Provide a reason for cancellation',
              closeOnSuccess: false,
            });
          }
        }

        if (role === 'warehouse' && status === 'in_transit') {
          const warehouseAssigned =
            entityData?.fulfilledById === viewerId ||
            entityData?.assignedWarehouse === viewerId ||
            entityData?.metadata?.warehouseId === viewerId;

          if (warehouseAssigned) {
            descriptors.push({
              key: 'complete_delivery',
              label: 'Mark Delivered',
              variant: 'primary',
              closeOnSuccess: false,
            });
            descriptors.push({
              key: 'cancel',
              label: 'Cancel',
              variant: 'danger',
              confirm: 'Are you sure you want to cancel this delivery?',
              prompt: 'Optional: Provide a reason for cancellation',
              closeOnSuccess: false,
            });
          }
        }

        // Crew fallback actions for Service Orders (pre-creation invite flow)
        if (role === 'crew' && status === 'crew_requested') {
          const viewerIdUC = (viewerId || '').toUpperCase();
          const crewRequests: Array<{ crewCode?: string; status?: string }> =
            (entityData?.metadata?.crewRequests as any[]) || [];
          const hasPendingInvite = !!viewerIdUC && crewRequests.some((req) =>
            (req?.status || '').toLowerCase() === 'pending' &&
            (req?.crewCode || '').toUpperCase() === viewerIdUC
          );
          if (hasPendingInvite) {
            descriptors.push({
              key: 'accept',
              label: 'Accept Invite',
              variant: 'primary',
              payload: { crewResponse: true },
              closeOnSuccess: false,
            });
            descriptors.push({
              key: 'reject',
              label: 'Decline Invite',
              variant: 'danger',
              confirm: 'Decline this service invite?',
              payload: { crewResponse: true },
              closeOnSuccess: false,
            });
          }
        }

        // Manager fallback actions for Service Orders
        if (role === 'manager' && (entityData?.orderType === 'service')) {
          // 1) Accept/Reject when pending manager approval
          if (status === 'pending_manager') {
            descriptors.push({
              key: 'accept',
              label: 'Accept',
              variant: 'primary',
              closeOnSuccess: false,
            });
            descriptors.push({
              key: 'reject',
              label: 'Reject',
              variant: 'danger',
              confirm: 'Are you sure you want to reject this service order?',
              prompt: 'Please provide a reason for rejection:',
              closeOnSuccess: false,
            });
          }

          // 2) Create Service (transform) after acceptance (or when backend allows)
          const notTransformed = !entityData?.transformedId;
          const canTransform = status === 'manager_accepted' || status === 'crew_assigned' || status === 'crew_requested';
          if (notTransformed && canTransform) {
            descriptors.push({
              key: 'create_service',
              label: 'Create Service',
              variant: 'primary',
              closeOnSuccess: false,
            });
          }
        }

        // Warehouse-managed service orders: warehouse is the actor for accept/create
        if (role === 'warehouse' && (entityData?.orderType === 'service')) {
          const svcManagedBy = String((entityData?.metadata?.serviceManagedBy || '')).toLowerCase();
          if (svcManagedBy === 'warehouse') {
            // Accept/Reject when pending warehouse
            if (status === 'pending_warehouse') {
              descriptors.push({ key: 'accept', label: 'Accept', variant: 'primary', closeOnSuccess: false });
              descriptors.push({ key: 'reject', label: 'Reject', variant: 'danger', confirm: 'Reject this service order?', prompt: 'Please provide a reason for rejection:', closeOnSuccess: false });
            }
            // Create Service after warehouse acceptance
            const notTransformed = !entityData?.transformedId;
            if (notTransformed && (status === 'warehouse_accepted')) {
              descriptors.push({ key: 'create_service', label: 'Create Service', variant: 'primary', closeOnSuccess: false });
            }
          }
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[OrderAdapter] Returning descriptors:', descriptors.length, descriptors);
    }
    return descriptors;
  },

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData, role, viewerId } = context as any;

    const formatDateTime = (value?: string) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      const date = d.toLocaleDateString('en-CA');
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      return `${date} - ${time}`;
    };

    const fields: HeaderField[] = [];

    if (entityData?.title) {
      fields.push({ label: 'Title', value: entityData.title });
    }

    if (entityData?.requestedBy) {
      fields.push({ label: 'Requested By', value: entityData.requestedBy });
    }

    if (entityData?.destination) {
      fields.push({ label: 'Destination', value: entityData.destination });
    }

    fields.push({ label: 'Requested', value: formatDateTime(entityData?.requestedDate) });

    if (entityData?.expectedDate) {
      fields.push({ label: 'Expected', value: formatDateTime(entityData.expectedDate) });
    }

    if (entityData?.serviceStartDate) {
      fields.push({ label: 'Service Start', value: formatDateTime(entityData.serviceStartDate) });
    }

    if (entityData?.deliveryDate) {
      fields.push({ label: 'Delivered', value: formatDateTime(entityData.deliveryDate) });
    }

    if (entityData?.transformedId) {
      fields.push({ label: 'Transformed To', value: entityData.transformedId });
    }

    return {
      id: entityData?.orderId || '',
      type: entityData?.orderType === 'service' ? 'Service Order' : 'Product Order',
      status: normalizeOrderStatus(entityData?.status),
      statusText: formatOrderStatus(entityData?.status),
      fields,
    };
  },

  getDetailsSections: buildOrderDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { entityData } = context;

    // Get sections for Details tab
    const detailsSections = buildOrderDetailsSections(context);

    // Build tab descriptors with content
    const tabs: TabDescriptor[] = [
      {
        id: 'details',
        label: 'Details',
        content: (
          <DetailsComposer
            sections={filterVisibleSections(detailsSections, {
              entityType: context.entityType,
              role: context.role,
              lifecycle: context.lifecycle,
              entityData,
            })}
          />
        ),
      },
      {
        id: 'history',
        label: 'History',
        content: (
          <HistoryTab
            entityType={context.entityType}
            entityId={entityData?.orderId}
          />
        ),
      },
      {
        id: 'actions',
        label: 'Quick Actions',
        content: (
          <OrderActionsContent
            actions={actions}
            approvalStages={entityData?.approvalStages}
          />
        ),
      },
    ];

    return tabs;
  },

  // LEGACY: Deprecated, kept for backward compatibility
  Component: ActivityModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle): ActivityModalProps => {
    return {
      isOpen: !!data,
      onClose,
      role: 'admin', // Will be overridden by ModalGateway
      order: data,
      actions,
      defaultExpanded: false,
      lifecycle, // NEW: Pass lifecycle metadata
      entityType: 'order',
      entityId: data?.orderId,
      // Additional order-specific props will be passed by ModalGateway
    };
  },
};

/**
 * Report Details Sections Builder
 */
function buildReportDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];
  const isReport = entityData?.type === 'report';

  // Helper to get role name from ID
  const getRoleName = (userId: string): string => {
    const prefix = userId?.split('-')[0]?.toUpperCase();
    const roleMap: Record<string, string> = {
      'CUS': 'Customer',
      'CEN': 'Center',
      'CON': 'Contractor',
      'CRW': 'Crew',
      'MGR': 'Manager',
      'WHS': 'Warehouse',
      'ADM': 'Administrator'
    };
    return roleMap[prefix] || 'User';
  };

  // Helper to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to get category display
  const getCategoryDisplay = (category?: string): string => {
    const map: Record<string, string> = {
      'service': 'Service',
      'order': 'Product Order',
      'procedure': 'Procedure'
    };
    return category ? (map[category] || category) : 'General';
  };

  // Helper to check if service is warehouse managed
  const isWarehouseManaged = (managed?: string | null): boolean => {
    if (!managed) return false;
    const val = managed.toString();
    return val.toLowerCase() === 'warehouse' || val.toUpperCase().startsWith('WHS-');
  };

  // Report Summary section
  const summaryFields: Array<{ label: string; value: string }> = [];

  summaryFields.push({
    label: 'Type',
    value: getCategoryDisplay(entityData?.reportCategory)
  });

  summaryFields.push({
    label: 'Submitted By',
    value: `${getRoleName(entityData?.submittedBy)} (${entityData?.submittedBy})`
  });

  if (entityData?.relatedEntityId) {
    summaryFields.push({
      label: entityData.reportCategory === 'order' ? 'Order' : entityData.reportCategory === 'service' ? 'Service' : 'Related To',
      value: entityData.relatedEntityId
    });

    summaryFields.push({
      label: 'Managed By',
      value: entityData.reportCategory === 'order' || isWarehouseManaged(entityData?.serviceManagedBy) ? 'Warehouse' : 'Manager'
    });
  }

  if (entityData?.reportReason) {
    summaryFields.push({
      label: isReport ? 'Issue' : 'Feedback',
      value: entityData.reportReason
    });
  }

  summaryFields.push({
    label: 'Date Submitted',
    value: formatDate(entityData?.submittedDate)
  });

  sections.push({
    id: 'report-summary',
    type: 'key-value-grid',
    title: `${isReport ? 'Report' : 'Feedback'} Summary`,
    columns: 2,
    fields: summaryFields,
  });

  // Full Description section
  if (entityData?.description) {
    sections.push({
      id: 'description',
      type: 'rich-text',
      title: 'Full Description',
      content: entityData.description,
    });
  }

  return sections;
}

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

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData, role, viewerId } = context as any;

    const fields: HeaderField[] = [];

    if (entityData?.reportReason) {
      fields.push({ label: 'Reason', value: entityData.reportReason });
    }

    const badges: React.ReactNode[] = [];

    // Priority badge
    if (entityData?.priority) {
      const priorityColors = {
        HIGH: { bg: '#fee2e2', text: '#991b1b' },
        MEDIUM: { bg: '#fef3c7', text: '#92400e' },
        LOW: { bg: '#dbeafe', text: '#1e40af' },
      };
      const color = priorityColors[entityData.priority];
      badges.push(
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: color.bg,
            color: color.text,
          }}
        >
          {entityData.priority}
        </span>
      );
    }

    // Rating stars (for feedback)
    if (entityData?.rating) {
      badges.push(
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                color: star <= entityData.rating ? '#fbbf24' : '#d1d5db',
                fontSize: '16px',
              }}
            >
              ★
            </span>
          ))}
        </div>
      );
    }

    return {
      id: entityData?.id || '',
      type: entityData?.type === 'feedback' ? 'Feedback' : 'Report',
      status: entityData?.status || 'open',
      fields,
      badges: badges.length > 0 ? badges : undefined,
    };
  },

  getDetailsSections: buildReportDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { entityData } = context;

    // Get sections for Details tab
    const detailsSections = buildReportDetailsSections(context);

    // Build tab descriptors with content
    const tabs: TabDescriptor[] = [
      {
        id: 'details',
        label: 'Details',
        content: (
          <DetailsComposer
            sections={filterVisibleSections(detailsSections, {
              entityType: context.entityType,
              role: context.role,
              lifecycle: context.lifecycle,
              entityData,
            })}
          />
        ),
      },
      {
        id: 'history',
        label: 'History',
        content: (
          <HistoryTab
            entityType={context.entityType}
            entityId={entityData?.id}
          />
        ),
      },
      {
        id: 'actions',
        label: 'Quick Actions',
        content: (
          <ReportQuickActions
            type={entityData?.type}
            status={entityData?.status}
            acknowledgments={entityData?.acknowledgments}
            resolvedBy={entityData?.resolvedBy}
            resolvedAt={entityData?.resolvedAt}
            resolution={entityData?.resolution}
            resolution_notes={entityData?.resolution_notes}
            currentUser={undefined} // Will be set by ModalGateway
            actions={actions}
          />
        ),
      },
    ];

    return tabs;
  },

  // LEGACY: Deprecated, kept for backward compatibility
  Component: ReportModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => {
    return {
      isOpen: !!data,
      onClose,
      report: data,
      actions,
      currentUser: undefined, // Will be set by ModalGateway
      showQuickActions: true,
      lifecycle, // NEW: Pass lifecycle metadata
      entityType: data?.type || 'report',
      entityId: data?.id,
    };
  },
};

/**
 * Service Section Builder
 */
function buildServiceDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];

  // Service Overview section
  const overviewFields: Array<{ label: string; value: string }> = [];

  // Overview fields read from normalized metadata when present
  const svcMeta: any = (entityData as any)?.metadata || {};
  overviewFields.push({
    label: 'Service Name',
    value: svcMeta.serviceName || entityData?.title || entityData?.serviceName || '-',
  });
  overviewFields.push({
    label: 'Service Type',
    value: svcMeta.serviceType || entityData?.serviceType || '-',
  });
  overviewFields.push({
    label: 'Status',
    value: svcMeta.serviceStatus || (entityData as any)?.status || '-',
  });

  if (entityData?.assignedTo) {
    overviewFields.push({ label: 'Assigned To', value: entityData.assignedTo });
  }

  if (entityData?.managedBy) {
    overviewFields.push({ label: 'Managed By', value: entityData.managedBy });
  }

  sections.push({
    id: 'service-overview',
    type: 'key-value-grid',
    title: 'Service Overview',
    columns: 2,
    fields: overviewFields,
  });

  // Description section (if available)
  if (entityData?.description) {
    sections.push({
      id: 'description',
      type: 'rich-text',
      title: 'Description',
      content: entityData.description,
    });
  }

  // NOTE: Complex service sections (crew, procedures, training, schedule)
  // can be added as either:
  // 1. New section primitives in @cks/ui/sections
  // 2. Custom sections passed through (for entity-specific complex layouts)
  //
  // For now, ServiceDetailsModal handles these with its own custom tabs.
  // Future: Migrate those to composable sections as needed.

  return sections;
}

/**
 * Service Adapter
 */
const serviceAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData } = context;
    const descriptors: EntityActionDescriptor[] = [];

    // Admin actions (unconditional on can(); backend enforces authorization)
    if (role === 'admin') {
      if (state === 'active') {
        descriptors.push({
          key: 'archive',
          label: 'Archive Service',
          variant: 'secondary',
          confirm: 'Are you sure you want to archive this service? You can restore it later.',
          prompt: 'Optional: Provide a reason for archiving this service',
          closeOnSuccess: true,
        });
      } else if (state === 'archived') {
        descriptors.push({
          key: 'restore',
          label: 'Restore Service',
          variant: 'secondary',
          closeOnSuccess: true,
        });
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

    // Manager lifecycle controls for archived services (Restore)
    if (role === 'manager' && state === 'archived') {
      descriptors.push({
        key: 'restore',
        label: 'Restore Service',
        variant: 'secondary',
        closeOnSuccess: true,
      });
    }

    // User workflow actions (start, complete, cancel)
    if (role !== 'admin' && state === 'active') {
      // Derive live service status from normalized service metadata
      const statusRaw = String((entityData as any)?.metadata?.serviceStatus || (entityData as any)?.status || '')
        .toLowerCase()
        .replace(/\s+/g, '_');
      const managedBy = String((entityData as any)?.metadata?.serviceManagedBy || (entityData as any)?.managedBy || '')
        .trim()
        .toLowerCase();

      // Managers control lifecycle when manager-managed
      if (role === 'manager' && managedBy !== 'warehouse' && can('service', 'start', role, { state, entityData }) && (statusRaw === 'pending' || statusRaw === 'created')) {
        descriptors.push({
          key: 'start',
          label: 'Start Service',
          variant: 'primary',
          closeOnSuccess: false, // Keep modal open to see updated status
        });
      }
      // Per UX: Start/Cancel when pending; Complete/Cancel when in progress (manager only, manager-managed)
      if (role === 'manager' && managedBy !== 'warehouse' && can('service', 'cancel', role, { state, entityData }) && (statusRaw === 'pending' || statusRaw === 'created' || statusRaw === 'in_progress')) {
        descriptors.push({
          key: 'cancel',
          label: 'Cancel Service',
          variant: 'danger',
          confirm: 'Cancel this service?',
          closeOnSuccess: true,
        });
      }
      if (role === 'manager' && managedBy !== 'warehouse' && can('service', 'complete', role, { state, entityData }) && statusRaw === 'in_progress') {
        descriptors.push({
          key: 'complete',
          label: 'Mark Complete',
          variant: 'primary',
          closeOnSuccess: true,
        });
      }

      // Warehouse-controlled lifecycle for warehouse-managed services
      if (role === 'warehouse' && managedBy === 'warehouse') {
        if (can('service', 'start', role, { state, entityData }) && (statusRaw === 'pending' || statusRaw === 'created')) {
          descriptors.push({ key: 'start', label: 'Start Service', variant: 'primary', closeOnSuccess: false });
        }
        if (can('service', 'cancel', role, { state, entityData }) && (statusRaw === 'pending' || statusRaw === 'created' || statusRaw === 'in_progress')) {
          descriptors.push({ key: 'cancel', label: 'Cancel Service', variant: 'danger', confirm: 'Cancel this service?', closeOnSuccess: true });
        }
        if (can('service', 'complete', role, { state, entityData }) && statusRaw === 'in_progress') {
          descriptors.push({ key: 'complete', label: 'Mark Complete', variant: 'primary', closeOnSuccess: true });
        }
      }

      // Assignments moved to dedicated tab; Quick Actions focus on lifecycle (manager only)
    }

    return descriptors;
  },

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData, role, viewerId } = context as any;

    const formatDateTime = (value?: string) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      const date = d.toLocaleDateString('en-CA');
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      return `${date} - ${time}`;
    };

    const fields: HeaderField[] = [];

    // Name-first convention for header card subtitle
    const svcMetaForHeader: any = (entityData as any)?.metadata || {};
    fields.push({ label: 'Name', value: svcMetaForHeader.serviceName || entityData?.title || entityData?.name || '-' });

    if (svcMetaForHeader.serviceType || entityData?.serviceType) {
      fields.push({ label: 'Type', value: svcMetaForHeader.serviceType || entityData?.serviceType });
    }

    // Assigned crew (universal visibility)
    const assignedCrew = Array.isArray(svcMetaForHeader.crew)
      ? (svcMetaForHeader.crew as any[])
          .map((c) => (typeof c === 'string' ? c : (c?.name || c?.code || '')))
          .filter(Boolean)
          .join(', ')
      : null;
    if (assignedCrew && assignedCrew.length > 0) {
      fields.push({ label: 'Assigned Crew', value: assignedCrew });
    }

    if (entityData?.managedBy) {
      fields.push({ label: 'Managed By', value: entityData.managedBy });
    }

    // Build badges: Managed By + Due Today (crew)
    const badges: React.ReactNode[] = [];

    // Managed By badge (Warehouse | Manager)
    try {
      const managedRaw = String(
        (svcMetaForHeader?.serviceManagedBy || (entityData as any)?.managedBy || '')
      )
        .trim()
        .toLowerCase();
      const isWarehouse = managedRaw === 'warehouse' || managedRaw.startsWith('whs-');
      const label = isWarehouse ? 'Warehouse' : 'Manager';
      const color = isWarehouse ? '#6b21a8' : '#1e3a8a'; // purple vs blue
      const bg = isWarehouse ? '#f3e8ff' : '#dbeafe';
      badges.push(
        <span
          key="managed-by"
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            color,
            backgroundColor: bg,
            border: `1px solid ${color}33`,
          }}
        >
          {label}
        </span>
      );
    } catch {}

    // Due Today badge for crew (viewer-assigned tasks due today and not completed)
    try {
      const viewer = (viewerId || '').toString().toUpperCase();
      const isCrew = String(role || '').toLowerCase() === 'crew';
      const statusRaw = String(
        (svcMetaForHeader?.serviceStatus || (entityData as any)?.status || '')
      )
        .toLowerCase()
        .replace(/\s+/g, '_');
      const active = statusRaw === 'in_progress';
      const tasks: any[] = Array.isArray(svcMetaForHeader?.tasks)
        ? (svcMetaForHeader?.tasks as any[])
        : [];
      if (isCrew && viewer && tasks.length > 0) {
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const todayKey = dayNames[new Date().getDay()];
        let due = 0;
        for (const t of tasks) {
          const assigned = Array.isArray(t?.assignedTo)
            ? t.assignedTo.map((x: any) => String(x).toUpperCase())
            : [];
          if (!assigned.includes(viewer)) continue;
          const days: string[] = Array.isArray(t?.days)
            ? t.days.map((d: any) => String(d).toLowerCase())
            : [];
          const freq = String(t?.frequency || '').toLowerCase();
          const dueToday = (days.length > 0 && days.includes(todayKey)) || freq === 'daily' || days.length === 0;
          const completed = Boolean((t as any)?.completedAt);
          if (dueToday && !completed) due += 1;
        }
        if (due > 0) {
          badges.push(
            <span
              key="due-today"
              title={active ? undefined : 'Service not started'}
              style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                color: '#92400e',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b55',
              }}
            >
              {`Due Today: ${due}`}
            </span>
          );
        }
      }
    } catch {}

    if (entityData?.startDate) {
      fields.push({ label: 'Start Date', value: formatDateTime(entityData.startDate) });
    }

    if (entityData?.completionDate) {
      fields.push({ label: 'Completion', value: formatDateTime(entityData.completionDate) });
    }

    return {
      id: entityData?.serviceId || '',
      type: 'Service',
      status: (svcMetaForHeader.serviceStatus || (entityData as any)?.status || 'created') as string,
      fields,
      badges: badges.length > 0 ? badges : undefined,
    };
  },

  getDetailsSections: buildServiceDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { entityData } = context;

    // Get sections for Details/Overview tab
    const detailsSections = buildServiceDetailsSections(context);

    const tabs: TabDescriptor[] = [
      {
        id: 'details',
        label: 'Overview',
        content: (
          <DetailsComposer
            sections={filterVisibleSections(detailsSections, {
              entityType: context.entityType,
              role: context.role,
              lifecycle: context.lifecycle,
              entityData,
            })}
          />
        ),
      },
      // Assignments tab: managers can assign crew, procedures, training
      ...(String((entityData?.metadata?.serviceManagedBy || '')).toLowerCase() !== 'warehouse' && context.role === 'manager'
        ? [
            {
              id: 'crew' as const,
              label: 'Assignments',
              content: (
                <ServiceAssignmentsTab
                  serviceId={entityData?.serviceId}
                  viewerCode={context.viewerId}
                  managedBy={entityData?.metadata?.serviceManagedBy}
                  assigned={(entityData as any)?.metadata?.crew || []}
                />
              ),
            },
            {
              id: 'procedures' as const,
              label: 'Procedures',
              content: (
                <ServiceProceduresTab serviceId={entityData?.serviceId} files={(entityData as any)?.metadata?.procedures || []} />
              ),
            },
            {
              id: 'training' as const,
              label: 'Training',
              content: (
                <ServiceTrainingTab serviceId={entityData?.serviceId} files={(entityData as any)?.metadata?.training || []} />
              ),
            },
          ]
        : []),
      // Tasks tab (manager): parse tasks from procedures and assign to crew
      ...(context.role === 'manager' ? [
        {
          id: 'tasks' as const,
          label: 'Tasks',
          content: (
            <ServiceTasksTab
              serviceId={entityData?.serviceId}
              procedures={(entityData as any)?.metadata?.procedures || []}
              existingTasks={(entityData as any)?.metadata?.tasks || []}
              viewerCode={context.viewerId}
            />
          ),
        },
      ] : []),
      // Crew tabs: My Tasks and Procedures (viewer). If opened with focus=crew-tasks, restrict to tasks only.
      ...(context.role === 'crew'
        ? (() => {
            const focusTasksOnly = (context as any)?.openContext?.focus === 'crew-tasks';
            const tabsForCrew: TabDescriptor[] = [
              {
                id: 'my-tasks' as const,
                label: 'My Tasks',
                content: (
                  <ServiceCrewTasksTab
                    serviceId={entityData?.serviceId}
                    tasks={(entityData as any)?.metadata?.tasks || []}
                    viewerCode={context.viewerId}
                    serviceStatus={(entityData as any)?.metadata?.serviceStatus || (entityData as any)?.status || null}
                  />
                ),
              },
            ];
            if (!focusTasksOnly) {
              tabsForCrew.push({
                id: 'procedures' as const,
                label: 'Procedures',
                content: (
                  <ServiceProceduresViewerTab files={(entityData as any)?.metadata?.procedures || []} />
                ),
              });
            }
            return tabsForCrew;
          })()
        : []),
      // Products tab (manager): link to catalog with service preselected
      ...(context.role === 'manager' ? [
        {
          id: 'products' as const,
          label: 'Products',
          content: (
            <ServiceProductsTab serviceId={entityData?.serviceId} />
          ),
        },
      ] : []),
      {
        id: 'history',
        label: 'History',
        content: (
          <HistoryTab
            entityType={context.entityType}
            entityId={entityData?.serviceId}
          />
        ),
      },
      // Quick Actions tab is still available universally, but content is lifecycle-only
      {
        id: 'actions',
        label: 'Quick Actions',
        content: (
          <UserQuickActionsContent actions={actions} />
        ),
      },
    ];

    // NOTE: ServiceDetailsModal has additional custom tabs (crew, procedures, training)
    // that are entity-specific. These can be migrated to composable sections in the future.

    return tabs;
  },

  // LEGACY: Deprecated, kept for backward compatibility
  Component: ServiceDetailsModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => {
    return {
      isOpen: !!data,
      onClose,
      service: data,
      actions,
      editable: false, // Will be determined by ModalGateway based on role
      lifecycle, // NEW: Pass lifecycle metadata
      entityType: 'service',
      entityId: data?.serviceId,
    };
  },
};

/**
 * User Details Sections Builder
 */
function buildUserDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData, entityType } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];

  // Map entity type to user role
  const roleMap: Record<string, string> = {
    manager: 'manager',
    contractor: 'contractor',
    customer: 'customer',
    center: 'center',
    crew: 'crew',
    warehouse: 'warehouse',
  };
  const userRole = roleMap[entityType] || entityType;

  // Map raw entity data to profile format
  const profileData = mapProfileDataForRole(userRole as any, entityData);

  // Contact Information section
  const contactFields: Array<{ label: string; value: string }> = [];

  if (profileData.fullName || profileData.name) {
    contactFields.push({ label: 'Full Name', value: profileData.fullName || profileData.name || '—' });
  }

  if (profileData.managerId || profileData.contractorId || profileData.customerId || profileData.centerId || profileData.crewId || profileData.warehouseId) {
    const idValue = profileData.managerId || profileData.contractorId || profileData.customerId || profileData.centerId || profileData.crewId || profileData.warehouseId;
    contactFields.push({ label: `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} ID`, value: idValue || '—' });
  }

  if (profileData.address) {
    contactFields.push({ label: 'Address', value: profileData.address });
  }

  if (profileData.phone) {
    contactFields.push({ label: 'Phone', value: profileData.phone });
  }

  if (profileData.email) {
    contactFields.push({ label: 'Email', value: profileData.email });
  }

  if (profileData.website) {
    contactFields.push({ label: 'Website', value: profileData.website });
  }

  if (profileData.mainContact) {
    contactFields.push({ label: 'Main Contact', value: profileData.mainContact });
  }

  if (profileData.emergencyContact) {
    contactFields.push({ label: 'Emergency Contact', value: profileData.emergencyContact });
  }

  sections.push({
    id: 'contact-info',
    type: 'key-value-grid',
    title: 'Contact Information',
    columns: 2,
    fields: contactFields,
  });

  // Role & Organization section (for managers)
  if (userRole === 'manager' && (profileData.territory || profileData.role || profileData.reportsTo)) {
    const roleFields: Array<{ label: string; value: string }> = [];

    if (profileData.territory) {
      roleFields.push({ label: 'Territory', value: profileData.territory });
    }

    if (profileData.role) {
      roleFields.push({ label: 'Role', value: profileData.role });
    }

    if (profileData.reportsTo) {
      roleFields.push({ label: 'Reports To', value: profileData.reportsTo });
    }

    if (roleFields.length > 0) {
      sections.push({
        id: 'role-organization',
        type: 'key-value-grid',
        title: 'Role & Organization',
        columns: 2,
        fields: roleFields,
      });
    }
  }

  // Start Date section
  if (profileData.startDate) {
    sections.push({
      id: 'timeline',
      type: 'key-value-grid',
      title: 'Timeline',
      columns: 2,
      fields: [{ label: 'Start Date', value: profileData.startDate }],
    });
  }

  return sections;
}

/**
 * User Quick Actions Content Component
 */
function UserQuickActionsContent({ actions }: { actions: EntityAction[] }) {
  return <UserQuickActions actions={actions} />;
}

/**
 * User Adapter (for manager, contractor, customer, center, crew, warehouse)
 */
const userAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state, entityData } = context;
    const descriptors: EntityActionDescriptor[] = [];

    // Admin actions only
    if (role === 'admin') {
      if (state === 'active') {
        // Invite action
        descriptors.push({
          key: 'invite',
          label: 'Invite',
          variant: 'primary',
          closeOnSuccess: false,
        });

        // Edit action
        descriptors.push({
          key: 'edit',
          label: 'Edit',
          variant: 'secondary',
          closeOnSuccess: false,
        });

        // Pause action
        descriptors.push({
          key: 'pause',
          label: 'Pause',
          variant: 'secondary',
          confirm: 'Are you sure you want to pause this account?',
          closeOnSuccess: false,
        });

        // Archive action
        if (can(context.entityType, 'archive', role, { state, entityData })) {
          descriptors.push({
            key: 'archive',
            label: 'Archive',
            variant: 'secondary',
            confirm: 'Are you sure you want to archive this user? You can restore it later.',
            prompt: 'Optional: Provide a reason for archiving this user',
            closeOnSuccess: true,
          });
        }
      } else if (state === 'archived') {
        if (can(context.entityType, 'restore', role, { state, entityData })) {
          descriptors.push({
            key: 'restore',
            label: 'Restore',
            variant: 'secondary',
            closeOnSuccess: true,
          });
        }
        if (can(context.entityType, 'delete', role, { state, entityData })) {
          descriptors.push({
            key: 'delete',
            label: 'Permanently Delete',
            variant: 'danger',
            confirm: 'Are you sure you want to PERMANENTLY delete this user? This cannot be undone.',
            prompt: 'Provide a deletion reason (optional):',
            closeOnSuccess: true,
          });
        }
      }
    }

    return descriptors;
  },

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData, entityType } = context;

    // Map entity type to user role
    const roleMap: Record<string, string> = {
      manager: 'Manager',
      contractor: 'Contractor',
      customer: 'Customer',
      center: 'Center',
      crew: 'Crew',
      warehouse: 'Warehouse',
    };
    const displayRole = roleMap[entityType] || entityType;

    const profileData = mapProfileDataForRole(entityType as any, entityData);

    const fields: HeaderField[] = [];

    // Add role-specific ID
    const userId = profileData.managerId || profileData.contractorId || profileData.customerId ||
                   profileData.centerId || profileData.crewId || profileData.warehouseId ||
                   entityData?.id || '';

    // Add name field (used by EntityHeaderCard)
    if (profileData.fullName || profileData.name) {
      fields.push({ label: 'Name', value: profileData.fullName || profileData.name || '' });
    }

    return {
      id: userId,
      type: displayRole,
      status: context.lifecycle?.state || 'active',
      fields,
    };
  },

  getDetailsSections: buildUserDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { entityData, entityType } = context;

    // Get profile data for Profile tab
    const profileData = mapProfileDataForRole(entityType as any, entityData);

    // Get accent color for this entity type (centralized)
    const accentColor = getEntityAccentColor(entityType);

    // Get user ID for History tab fetch
    const userId = profileData.managerId || profileData.contractorId || profileData.customerId ||
                   profileData.centerId || profileData.crewId || profileData.warehouseId ||
                   entityData?.id || '';

    // Build tab descriptors (final order): Profile, Quick Actions, History
    const tabs: TabDescriptor[] = [
      {
        id: 'profile',
        label: 'Profile',
        content: (
          <ProfileInfoCard
            role={entityType as any}
            profileData={profileData}
            accountManager={null}
            primaryColor={accentColor}
            hideTabs
            borderless
            enabledTabs={['profile']}
          />
        ),
      },
      {
        id: 'actions',
        label: 'Quick Actions',
        content: (
          <UserQuickActionsContent actions={actions} />
        ),
      },
      {
        id: 'history',
        label: 'History',
        content: (
          <HistoryTab
            entityId={userId}
            entityType={entityType}
          />
        ),
      },
    ];

    return tabs;
  },

  // LEGACY: Deprecated, kept for backward compatibility
  Component: UserModal,

  mapToProps: (data: any, actions: EntityAction[], onClose: () => void, lifecycle: Lifecycle) => {
    return {
      isOpen: !!data,
      onClose,
      user: {
        id: data?.id,
        name: data?.name || data?.fullName,
        status: data?.status,
        role: data?.role,
      },
      actions,
      profileData: data,
      lifecycle,
      entityType: data?.entityType || 'manager',
      entityId: data?.id,
    };
  },
};

/**
 * Catalog Service Section Builder
 */
function buildCatalogServiceDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];

  // Service Information section
  const infoFields: Array<{ label: string; value: string }> = [];

  infoFields.push({ label: 'Service ID', value: entityData?.serviceId || '-' });
  infoFields.push({ label: 'Name', value: entityData?.name || '-' });

  if (entityData?.category) {
    infoFields.push({ label: 'Category', value: entityData.category });
  }

  if (entityData?.status) {
    infoFields.push({ label: 'Status', value: entityData.status });
  }

  if (entityData?.managedBy) {
    infoFields.push({ label: 'Managed By', value: entityData.managedBy });
  }

  sections.push({
    id: 'service-info',
    type: 'key-value-grid',
    title: 'Service Information',
    columns: 2,
    fields: infoFields,
  });

  // Description section (if available)
  if (entityData?.description) {
    sections.push({
      id: 'description',
      type: 'rich-text',
      title: 'Description',
      content: entityData.description,
    });
  }

  // Additional details (if available)
  const additionalFields: Array<{ label: string; value: string }> = [];

  if (entityData?.durationMinutes) {
    additionalFields.push({ label: 'Duration', value: `${entityData.durationMinutes} minutes` });
  }

  if (entityData?.serviceWindow) {
    additionalFields.push({ label: 'Service Window', value: entityData.serviceWindow });
  }

  if (entityData?.crewRequired) {
    additionalFields.push({ label: 'Crew Required', value: String(entityData.crewRequired) });
  }

  if (additionalFields.length > 0) {
    sections.push({
      id: 'additional-details',
      type: 'key-value-grid',
      title: 'Additional Details',
      columns: 2,
      fields: additionalFields,
    });
  }

  return sections;
}

/**
 * Catalog Service Adapter
 * For catalog service definitions (unscoped SRV-XXX like SRV-001, SRV-123)
 */
const catalogServiceAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state } = context;
    const descriptors: EntityActionDescriptor[] = [];

    console.log('[CatalogServiceAdapter] getActionDescriptors:', { role, state });

    // Admin-only actions
    if (role === 'admin') {
      if (state === 'active') {
        console.log('[CatalogServiceAdapter] Adding Edit + Archive actions for active state');
        // Edit action
        descriptors.push({
          key: 'edit',
          label: 'Edit',
          variant: 'secondary',
          closeOnSuccess: false,
        });

        // Archive action for catalog services (not hard delete)
        descriptors.push({
          key: 'archive',
          label: 'Archive',
          variant: 'secondary',
          confirm: 'Are you sure you want to archive this catalog service? You can restore it later.',
          prompt: 'Optional: Provide a reason for archiving this catalog service',
          closeOnSuccess: true,
        });
      } else if (state === 'archived') {
        console.log('[CatalogServiceAdapter] Adding Restore + Delete actions for archived state');
        // Restore action
        descriptors.push({
          key: 'restore',
          label: 'Restore',
          variant: 'secondary',
          closeOnSuccess: true,
        });

        // Delete action (permanent)
        descriptors.push({
          key: 'delete',
          label: 'Permanently Delete',
          variant: 'danger',
          confirm: 'Are you sure you want to PERMANENTLY delete this catalog service? This cannot be undone.',
          closeOnSuccess: true,
        });
      }
    }

    return descriptors;
  },

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;
    const fields: HeaderField[] = [];

    // Name-first convention: EntityModalView extracts label 'Name' as header subtitle
    fields.push({ label: 'Name', value: entityData?.name || '-' });

    if (entityData?.serviceId) {
      fields.push({ label: 'ID', value: entityData.serviceId });
    }

    if (entityData?.category) {
      fields.push({ label: 'Category', value: entityData.category });
    }

    return {
      id: entityData?.serviceId || '',
      type: 'Service',
      status: entityData?.status || 'active',
      fields,
    };
  },

  getDetailsSections: buildCatalogServiceDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { role, entityData, entityType } = context;
    const tabs: TabDescriptor[] = [];

    console.log('[CatalogServiceAdapter] getTabDescriptors called:', {
      role,
      entityType,
      hasEntityData: !!entityData,
      hasPeopleManagers: !!entityData?.peopleManagers,
      peopleManagersCount: entityData?.peopleManagers?.length,
      certifiedManagersCount: entityData?.certifiedManagers?.length
    });

    // Details tab - using ServiceDetails component from @cks/ui
    tabs.push({
      id: 'details',
      label: 'Details',
      content: (
        <ServiceDetails
          serviceId={entityData?.serviceId || ''}
          serviceName={entityData?.name || 'Unnamed Service'}
          category={entityData?.category}
          status={entityData?.status || 'active'}
          managedBy={entityData?.managedBy || 'manager'}
          description={entityData?.description}
        />
      ),
    });

    // Note: No separate Actions tab for catalog services; admin actions render inside Quick Actions

    // Admin-only: Quick Actions tab for certification management
    console.log('[CatalogServiceAdapter] Checking admin condition:', {
      role,
      isAdmin: role === 'admin',
      hasPeopleManagers: !!entityData?.peopleManagers,
      hasAdminData: !!(entityData?.peopleManagers || entityData?.certifiedManagers)
    });

    // Only show Quick Actions if we have admin data loaded (prevents missing tabs on first render)
    if (role === 'admin' && (entityData?.peopleManagers || entityData?.certifiedManagers)) {
      console.log('[CatalogServiceAdapter] Adding Quick Actions tab for admin (admin data present)');
      // Build CertifiedUser arrays (mark who's certified)
      const certifiedSet = {
        manager: new Set(entityData?.certifiedManagers || []),
        contractor: new Set(entityData?.certifiedContractors || []),
        crew: new Set(entityData?.certifiedCrew || []),
        warehouse: new Set(entityData?.certifiedWarehouses || []),
      };

      const managersData = (entityData?.peopleManagers || []).map((u: any) => ({
        code: u.code,
        name: u.name,
        isCertified: certifiedSet.manager.has(u.code),
      }));

      const contractorsData = (entityData?.peopleContractors || []).map((u: any) => ({
        code: u.code,
        name: u.name,
        isCertified: certifiedSet.contractor.has(u.code),
      }));

      const crewData = (entityData?.peopleCrew || []).map((u: any) => ({
        code: u.code,
        name: u.name,
        isCertified: certifiedSet.crew.has(u.code),
      }));

      const warehousesData = (entityData?.peopleWarehouses || []).map((u: any) => ({
        code: u.code,
        name: u.name,
        isCertified: certifiedSet.warehouse.has(u.code),
      }));

      tabs.unshift({
        id: 'quick-actions',
        label: 'Quick Actions',
        content: (
          <ServiceQuickActions
            managers={managersData}
            contractors={contractorsData}
            crew={crewData}
            warehouses={warehousesData}
            managedBy={entityData?.managedBy || 'manager'}
            category={entityData?.category || ''}
            onSave={async (changes) => {
              const serviceId = entityData?.serviceId;
              if (!serviceId) {
                console.error('[CatalogService] No serviceId available for saving certifications');
                return;
              }

              try {
                // Calculate add/remove for each role
                const roles: Array<'manager' | 'contractor' | 'crew' | 'warehouse'> = [
                  'manager',
                  'contractor',
                  'crew',
                  'warehouse',
                ];

                const initialState = {
                  manager: new Set(entityData?.certifiedManagers || []),
                  contractor: new Set(entityData?.certifiedContractors || []),
                  crew: new Set(entityData?.certifiedCrew || []),
                  warehouse: new Set(entityData?.certifiedWarehouses || []),
                };

                // Send updates for each role that has changes
                for (const role of roles) {
                  const currentSet = new Set(changes[role]);
                  const initial = initialState[role];

                  const add = changes[role].filter((code: string) => !initial.has(code));
                  const remove = Array.from(initial).filter((code) => !currentSet.has(code));

                  if (add.length > 0 || remove.length > 0) {
                    console.log(`[CatalogService] Updating ${role} certifications:`, { add, remove });
                    await patchServiceAssignments(serviceId, { role, add, remove });
                  }
                }

                console.log('[CatalogService] Certifications saved successfully');
                toast.success('Certifications saved');
                window.dispatchEvent(new CustomEvent('cks:modal:close'));
              } catch (error) {
                console.error('[CatalogService] Failed to save certifications:', error);
                throw error; // Let ServiceQuickActions show error
              }
            }}
            adminActions={actions.map(a => ({
              label: a.label,
              onClick: a.onClick,
              variant: a.variant as any,
              disabled: a.disabled,
            }))}
          />
        ),
      });
    }

    // History tab - shows lifecycle events (created, archived, restored, deleted, certifications)
    // Admin-only visibility enforced by tabs.ts policy
    tabs.push({
      id: 'history',
      label: 'History',
      content: (
        <HistoryTab
          entityType="catalogService"
          entityId={entityData?.serviceId}
        />
      ),
    });

    return tabs;
  },

  // No legacy component support for catalog services
};

/**
 * Product Details Sections Builder (unified)
 */
function buildProductDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];

  // Product Information
  const infoFields: Array<{ label: string; value: string }> = [];
  infoFields.push({ label: 'Product ID', value: entityData?.productId || '-' });
  infoFields.push({ label: 'Name', value: entityData?.name || '-' });
  if (entityData?.category) infoFields.push({ label: 'Category', value: entityData.category });
  if (entityData?.unitOfMeasure) infoFields.push({ label: 'Unit', value: entityData.unitOfMeasure });
  if (entityData?.price != null) infoFields.push({ label: 'Price', value: String(entityData.price) });

  sections.push({
    id: 'product-info',
    type: 'key-value-grid',
    title: 'Product Information',
    columns: 2,
    fields: infoFields,
  });

  // Description
  if (entityData?.description) {
    sections.push({
      id: 'description',
      type: 'rich-text',
      title: 'Description',
      content: entityData.description,
    });
  }

  // Inventory snapshot (read-only in Details)
  if (Array.isArray(entityData?.inventoryData) && entityData.inventoryData.length > 0) {
    sections.push({
      id: 'inventory',
      type: 'items-table',
      title: 'Inventory',
      columns: [
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'onHand', label: 'On Hand' },
        { key: 'minLevel', label: 'Min Level' },
        { key: 'location', label: 'Location' },
      ],
      rows: entityData.inventoryData.map((inv: any) => ({
        warehouse: `${inv.warehouseName || '-'} (${inv.warehouseId || '-'})`,
        onHand: inv.quantityOnHand ?? '-',
        minLevel: inv.minStockLevel ?? '-',
        location: inv.location ?? '-',
      })),
    });
  }

  return sections;
}

/**
 * Product Adapter - unified modal system
 */
const productAdapter: EntityAdapter = {
  getActionDescriptors: (context: EntityActionContext): EntityActionDescriptor[] => {
    const { role, state } = context;
    const descriptors: EntityActionDescriptor[] = [];
    if (role === 'admin') {
      if (state === 'active') {
        // Keep parity with services: Edit + Archive
        descriptors.push({ key: 'edit', label: 'Edit', variant: 'secondary', closeOnSuccess: false });
        descriptors.push({ key: 'archive', label: 'Archive', variant: 'secondary', confirm: 'Are you sure you want to archive this product? You can restore it later.', prompt: 'Optional: Provide a reason for archiving this product', closeOnSuccess: true });
      } else if (state === 'archived') {
        descriptors.push({ key: 'restore', label: 'Restore Product', variant: 'secondary', closeOnSuccess: true });
        descriptors.push({ key: 'delete', label: 'Permanently Delete Product', variant: 'danger', confirm: 'Are you sure you want to PERMANENTLY delete this product? This cannot be undone.', prompt: 'Provide a deletion reason (optional):', closeOnSuccess: true });
      }
    }
    return descriptors;
  },

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;
    const fields: HeaderField[] = [];

    // Name-first convention for header card
    fields.push({ label: 'Name', value: entityData?.name || '-' });
    if (entityData?.category) fields.push({ label: 'Category', value: entityData.category });
    if (entityData?.unitOfMeasure) fields.push({ label: 'Unit', value: entityData.unitOfMeasure });

    return {
      id: entityData?.productId || '',
      type: 'Product',
      status: entityData?.status || 'active',
      fields,
    };
  },

  getDetailsSections: buildProductDetailsSections,

  getTabDescriptors: (context: TabVisibilityContext, actions: EntityAction[]): TabDescriptor[] => {
    const { entityData, role } = context;

    const detailsSections = buildProductDetailsSections(context);

    const tabs: TabDescriptor[] = [
      {
        id: 'details',
        label: 'Details',
        content: (
          <DetailsComposer
            sections={filterVisibleSections(detailsSections, {
              entityType: context.entityType,
              role: context.role,
              lifecycle: context.lifecycle,
              entityData,
            })}
          />
        ),
      },
      {
        id: 'history',
        label: 'History',
        content: (
          <HistoryTab
            entityType={context.entityType}
            entityId={entityData?.productId}
            getAuthToken={context.getAuthToken}
          />
        ),
      },
    ];

    // Admin-only: Inventory management quick actions
    if (role === 'admin') {
      tabs.unshift({
        id: 'quick-actions',
        label: 'Quick Actions',
        content: (
          <ProductQuickActions
            inventoryData={entityData?.inventoryData || []}
            onSave={async (changes) => {
              const productId = entityData?.productId;
              if (!productId) return;
              for (const change of changes) {
                await updateInventory({
                  warehouseId: change.warehouseId,
                  itemId: productId,
                  quantityChange: change.quantityChange,
                  reason: 'Admin adjustment via product quick actions',
                });
              }
              try {
                const result = await getProductInventory(productId);
                if (result?.success && Array.isArray(result.data)) {
                  (entityData as any).inventoryData = result.data;
                }
              } catch (e) {
                console.warn('[ProductAdapter] Failed to refresh inventory', e);
              }
              toast.success('Inventory saved');
            }}
            adminActions={actions.map(a => ({
              label: a.label,
              onClick: a.onClick,
              variant: a.variant as any,
              disabled: a.disabled,
            }))}
          />
        ),
      });
    }

    return tabs;
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
  catalogService: catalogServiceAdapter, // ✅ Catalog service definitions (SRV-XXX unscoped)
  manager: userAdapter,
  contractor: userAdapter,
  customer: userAdapter,
  center: userAdapter,
  crew: userAdapter,
  product: productAdapter,
  warehouse: userAdapter,
};
