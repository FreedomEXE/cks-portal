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
} from '@cks/ui';
import type { ActivityModalProps } from '@cks/ui';
import { DetailsComposer } from '@cks/domain-widgets';
import { filterVisibleSections } from '../policies/sections';

/**
 * Order Details Sections Builder
 */
function buildOrderDetailsSections(context: TabVisibilityContext): import('@cks/ui').SectionDescriptor[] {
  const { entityData } = context;
  const sections: import('@cks/ui').SectionDescriptor[] = [];
  const isProduct = entityData?.orderType === 'product';

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

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;

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
      status: entityData?.status || 'pending',
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
    const { entityData } = context;

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

  overviewFields.push({ label: 'Service Name', value: entityData?.serviceName || '-' });
  overviewFields.push({ label: 'Service Type', value: entityData?.serviceType || '-' });
  overviewFields.push({ label: 'Status', value: entityData?.status || '-' });

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

  getHeaderConfig: (context: TabVisibilityContext): HeaderConfig => {
    const { entityData } = context;

    const formatDateTime = (value?: string) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      const date = d.toLocaleDateString('en-CA');
      const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      return `${date} - ${time}`;
    };

    const fields: HeaderField[] = [];

    fields.push({ label: 'Service', value: entityData?.serviceName || '—' });

    if (entityData?.serviceType) {
      fields.push({ label: 'Type', value: entityData.serviceType });
    }

    if (entityData?.assignedTo) {
      fields.push({ label: 'Assigned To', value: entityData.assignedTo });
    }

    if (entityData?.managedBy) {
      fields.push({ label: 'Managed By', value: entityData.managedBy });
    }

    if (entityData?.startDate) {
      fields.push({ label: 'Start Date', value: formatDateTime(entityData.startDate) });
    }

    if (entityData?.completionDate) {
      fields.push({ label: 'Completion', value: formatDateTime(entityData.completionDate) });
    }

    return {
      id: entityData?.serviceId || '',
      type: 'Service',
      status: entityData?.status || 'pending',
      fields,
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
 * Entity Registry - Add new entity types here
 */
export const entityRegistry: EntityRegistry = {
  order: orderAdapter,
  report: reportAdapter,
  feedback: reportAdapter, // Feedback uses same adapter as report
  service: serviceAdapter,
};
