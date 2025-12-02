import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button, OrderCard, TabSection } from '@cks/ui';
import styles from './OrdersSection.module.css';

interface Order {
  orderId: string;
  orderType: 'service' | 'product';
  title: string;
  requestedBy: string;
  destination?: string;  // Destination for the order
  requestedDate: string;
  expectedDate?: string;  // Date requested by customer/center
  serviceStartDate?: string;  // Actual date set by Manager when creating service
  deliveryDate?: string;  // Actual date when product was delivered
  status: 'pending' | 'in-progress' | 'approved' | 'rejected' | 'cancelled' | 'delivered' | 'service-created' | 'crew-requested' | 'crew-assigned' | 'manager-accepted';
  approvalStages?: Array<{
    role: string;
    status: 'pending' | 'approved' | 'rejected' | 'waiting' | 'accepted' | 'requested' | 'delivered';
    user?: string;
    timestamp?: string;
  }>;
  centerId?: string;
  customerId?: string;
  contractorId?: string;
  managerId?: string;
  transformedId?: string; // For archive tab to show transformation
  availableActions?: string[]; // Actions from policy backend
}

interface OrdersSectionProps {
  userRole: 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  userCode?: string;  // User's CKS code (e.g., "CON-010", "MGR-012")
  serviceOrders?: Order[];
  productOrders?: Order[];
  onCreateServiceOrder?: () => void;
  onCreateProductOrder?: () => void;
  onOrderAction?: (orderId: string, action: string) => void;
  showServiceOrders?: boolean;
  showProductOrders?: boolean;
  readOnlyProduct?: boolean;
  primaryColor?: string;
  initialOrderTab?: 'all' | 'service' | 'product' | 'archive';  // Initial tab to show (from URL params)
  newOrderId?: string;  // Newly created order ID to highlight (from URL params)
  onHighlightReady?: () => void;  // Callback when order is found and ready
  onHighlightComplete?: () => void;  // Callback to clean up URL param
}

const OrdersSection: React.FC<OrdersSectionProps> = ({
  userRole,
  userCode,
  serviceOrders = [],
  productOrders = [],
  onCreateServiceOrder,
  onCreateProductOrder,
  onOrderAction,
  showServiceOrders = true,
  showProductOrders = true,
  readOnlyProduct = false,
  primaryColor = '#3b82f6',
  initialOrderTab,
  newOrderId,
  onHighlightReady,
  onHighlightComplete,
}) => {

  // Determine initial tab based on what's available
  const getInitialTab = () => {
    // Use initialOrderTab if provided (from URL params)
    if (initialOrderTab) return initialOrderTab;

    // Warehouse doesn't have "All Orders", so default to service/product
    if (userRole === 'warehouse') {
      if (showServiceOrders) return 'service';
      if (showProductOrders) return 'product';
      return 'archive';
    }
    // Everyone else defaults to "All Orders"
    return 'all';
  };

  const [activeOrderTab, setActiveOrderTab] = useState<string>(getInitialTab());
  const [searchQuery, setSearchQuery] = useState('');

  // Combine all orders for counting
  const allOrders = [...serviceOrders, ...productOrders];

  // Simple highlight logic: when newOrderId exists and order is present, signal ready
  const highlightRef = useRef<HTMLDivElement>(null);
  const readyCalledRef = useRef(false);

  useEffect(() => {
    if (!newOrderId || readyCalledRef.current) return;

    const orderExists = allOrders.some((o) => o.orderId === newOrderId);
    if (orderExists) {
      readyCalledRef.current = true;
      onHighlightReady?.();  // Signal hub to turn off loader

      // Scroll to highlighted order
      requestAnimationFrame(() => {
        if (highlightRef.current) {
          highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }, [newOrderId, allOrders, onHighlightReady]);

  // Helper to check if user is directly involved in an order
  const isDirectlyInvolved = useCallback((order: Order): boolean => {
    // Check if user is creator (requestedBy starts with userCode like "MGR-012" or "MGR-012 - Name")
    if (userCode && order.requestedBy) {
      if (order.requestedBy.startsWith(userCode)) {
        return true;
      }
    }

    // Warehouse is always involved in product orders (they're the fulfillment role)
    if (userRole === 'warehouse' && order.orderType === 'product') {
      return true;
    }

    // Check if user has actions beyond just "View Details"
    const actions = order.availableActions || [];
    const hasActions = actions.some(action => action !== 'View Details');
    if (hasActions) return true;

    // If listed in approval workflow chain, treat as involved ("waiting")
    if (Array.isArray(order.approvalStages) && order.approvalStages.length > 0) {
      const rolesInFlow = new Set(order.approvalStages.map((s) => (s.role || '').toLowerCase()));
      if (rolesInFlow.has(userRole.toLowerCase())) {
        return true;
      }
    }

    return false;
  }, [userCode, userRole]);

  // Count orders by type and status
  const allOrdersCount = allOrders.filter(o =>
    ['pending', 'in-progress', 'approved', 'crew-requested'].includes(o.status)  // Active orders
  ).length;

  // For type-specific tabs, count only directly involved orders
  const serviceOrdersCount = serviceOrders.filter(o =>
    ['pending', 'in-progress', 'approved', 'crew-requested'].includes(o.status) && isDirectlyInvolved(o)
  ).length;

  const productOrdersCount = productOrders.filter(o =>
    ['pending', 'in-progress', 'approved'].includes(o.status) && isDirectlyInvolved(o)
  ).length;

  const archiveCount = allOrders.filter(o =>
    ['cancelled', 'rejected', 'delivered', 'completed', 'archived', 'service-created'].includes(o.status)  // Only truly completed/terminated orders
  ).length;

  // Non-admin users see "Order History" instead of "Archive"
  const archiveTabLabel = userRole === 'admin' ? 'Archive' : 'Order History';
  const archiveSearchPlaceholder = userRole === 'admin' ? 'Search archived orders...' : 'Search order history...';

  // Get tab description based on user role and active tab
  const getTabDescription = () => {
    if (activeOrderTab === 'all') {
      return 'All orders visible to you based on your role and permissions';
    } else if (activeOrderTab === 'service') {
      switch (userRole) {
        case 'manager':
          return 'Service orders requiring your approval or assignment';
        case 'contractor':
          return 'Service requests from your customers and centers';
        case 'customer':
        case 'center':
          return 'Service requests you have created or need to approve';
        case 'crew':
          return 'Service assignments requiring your acceptance';
        default:
          return 'Service requests pending approval or in progress';
      }
    } else if (activeOrderTab === 'product') {
      if (readOnlyProduct) {
        return 'Product orders in your ecosystem (Read-Only)';
      }
      switch (userRole) {
        case 'warehouse':
          return 'Product requests awaiting fulfillment';
        case 'contractor':
          return 'Product requests requiring your approval';
        case 'crew':
          return 'Equipment and product requests for your operations';
        default:
          return 'Equipment and product requests for your operations';
      }
    } else {
      return 'Completed and cancelled orders from the past 90 days';
    }
  };

  const filterOrders = (orders: Order[], tabType: string) => {
    let filtered = orders;

    // Filter by search query (null-safe)
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter((order) => {
        const id = (order.orderId || '').toLowerCase();
        const title = (order.title || '').toLowerCase();
        const requester = (order.requestedBy || '').toLowerCase();
        return id.includes(q) || title.includes(q) || requester.includes(q);
      });
    }

    // Filter by tab status (null-safe)
    if (tabType === 'archive') {
      const doneStatuses = new Set(['cancelled', 'rejected', 'delivered', 'completed', 'archived', 'service-created']);
      return filtered.filter((o) => doneStatuses.has((o.status || '').toLowerCase()));
    } else {
      const activeStatuses = new Set(['pending', 'in-progress', 'approved', 'crew-requested', 'crew-assigned', 'manager-accepted']);
      return filtered.filter((o) => activeStatuses.has((o.status || '').toLowerCase()));
    }
  };

  const getDisplayOrders = useMemo(() => {
    let filtered: Order[] = [];

    if (activeOrderTab === 'all') {
      // All Orders tab shows both product and service orders from entire ecosystem
      filtered = filterOrders(allOrders, activeOrderTab);
    } else if (activeOrderTab === 'service') {
      // Service Orders tab shows only orders where user is directly involved
      const involved = serviceOrders.filter(isDirectlyInvolved);
      filtered = filterOrders(involved, activeOrderTab);
    } else if (activeOrderTab === 'product') {
      // Product Orders tab shows only orders where user is directly involved
      const involved = productOrders.filter(isDirectlyInvolved);
      filtered = filterOrders(involved, activeOrderTab);
    } else {
      // Archive tab shows all completed/cancelled orders
      filtered = filterOrders(allOrders, 'archive');
    }

    // Ensure highlighted order is always included (bypass filters temporarily)
    if (newOrderId) {
      const hasHighlight = filtered.some((o) => o.orderId === newOrderId);
      if (!hasHighlight) {
        const highlightOrder = allOrders.find((o) => o.orderId === newOrderId);
        if (highlightOrder) {
          filtered = [highlightOrder, ...filtered];
        }
      }
    }

    return filtered;
  }, [activeOrderTab, serviceOrders, productOrders, allOrders, searchQuery, userCode, isDirectlyInvolved, newOrderId]);

  const getOrderActions = (order: Order): string[] => {
    // Use actions from backend policy if available
    if (order.availableActions && order.availableActions.length > 0) {
      // Filter out delivery actions for warehouse in Orders section (those belong in Deliveries section)
      let actions = [...order.availableActions];
      // Safety guard: only the next pending actor should see Accept/Reject
      const nextPendingRole = order.approvalStages?.find(s => s.status === 'pending')?.role?.toLowerCase();
      if (nextPendingRole && nextPendingRole !== userRole.toLowerCase()) {
        actions = actions.filter(a => {
          const l = a.toLowerCase();
          return !(l === 'accept' || l === 'reject' || l === 'approve' || l === 'deny');
        });
      }
      if (userRole === 'warehouse' && order.orderType === 'product') {
        actions = actions.filter(action => action !== 'Start Delivery' && action !== 'Mark Delivered');
      }

      // Post-accept manager tools: if manager has approved and service not created yet,
      // expose helper actions even if policy doesn't enumerate them (UI-only helpers).
      if (userRole === 'manager' && order.orderType === 'service') {
        const mgrStage = order.approvalStages?.find(s => (s.role || '').toLowerCase() === 'manager');
        if (mgrStage && mgrStage.status === 'approved' && order.status !== 'service-created') {
          if (!actions.includes('Add Crew')) actions.push('Add Crew');
          if (!actions.includes('Add Procedure')) actions.push('Add Procedure');
          if (!actions.includes('Add Training')) actions.push('Add Training');
        }
      }

      // Always ensure "View Details" is included
      if (!actions.includes('View Details')) {
        actions.push('View Details');
      }
      return actions;
    }

    // Fallback to legacy logic if no policy actions available
    const actions: string[] = [];

    if (order.status === 'cancelled' || order.status === 'rejected' || order.status === 'delivered' || order.status === 'service-created') {
      return ['View Details'];
    }

    switch (userRole) {
      case 'manager':
        if (order.orderType === 'service') {
          if (order.status === 'pending') {
            actions.push('Assign Crew', 'Add Training', 'Create Service');
          } else {
            actions.push('View Details');
          }
        } else if (order.orderType === 'product') {
          // Manager can create product orders
          actions.push('View Details');
        } else {
          actions.push('View Details');
        }
        break;

      case 'contractor':
        if (order.status === 'pending') {
          actions.push('Approve', 'Reject');
        } else {
          actions.push('View Details');
        }
        break;

      case 'customer':
      case 'center':
        if (order.status === 'pending' && order.requestedBy.includes(userRole)) {
          actions.push('Cancel');
        } else {
          actions.push('View Details');
        }
        break;

      case 'crew':
        if (order.orderType === 'service' && (order as any).crewAssignmentStatus === 'pending') {
          // Crew can accept or deny service assignments
          actions.push('Accept', 'Deny');
        } else if (order.orderType === 'product' && order.status === 'pending' && order.requestedBy.includes('Crew')) {
          actions.push('Cancel');
        } else {
          actions.push('View Details');
        }
        break;

      case 'warehouse':
        if (order.orderType === 'product') {
          if (order.status === 'pending') {
            actions.push('Accept', 'Deny');
          } else {
            // After accept, no actions in Orders section (delivery actions moved to Deliveries section)
            actions.push('View Details');
          }
        } else if (order.orderType === 'service' && order.status === 'pending') {
          // Warehouse can fulfill services
          actions.push('Accept', 'Deny');
        } else {
          actions.push('View Details');
        }
        break;

      default:
        actions.push('View Details');
    }

    return actions;
  };

  const renderOrderCards = (orders: Order[]) => {
    if (orders.length === 0) {
      return (
        <div style={{
          padding: '48px 16px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 12,
            opacity: 0.5
          }}>
            📋
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#6b7280'
          }}>
            No orders found
          </div>
          <div style={{
            fontSize: 12,
            color: '#9ca3af',
            marginTop: 4
          }}>
            Orders will appear here as they are created
          </div>
        </div>
      );
    }

    return (
      <div>
        {orders.map((order) => {
          // Compute a friendlier label for users who are waiting (future actor)
          let statusText: string | undefined = undefined;
          if (order.status === 'in-progress' && Array.isArray(order.approvalStages) && order.approvalStages.length > 0) {
            const stageForRole = order.approvalStages.find(s => (s.role || '').toLowerCase() === userRole.toLowerCase());
            if (stageForRole && stageForRole.status === 'waiting') {
              statusText = 'waiting';
            }
          }

          // Simple highlight check
          const isHighlighted = newOrderId && order.orderId === newOrderId;

          return (
            <div
              key={order.orderId}
              ref={isHighlighted ? highlightRef : null}
              onAnimationEnd={isHighlighted ? () => onHighlightComplete?.() : undefined}
              className={isHighlighted ? styles.newOrder : ''}
            >
              <OrderCard
                orderId={order.orderId}
                orderType={order.orderType}
                title={order.title}
                requestedBy={order.requestedBy}
                destination={order.destination}
                requestedDate={order.requestedDate}
                expectedDate={order.expectedDate}
                status={order.status}
                statusText={statusText}
                approvalStages={order.approvalStages}
                actions={getOrderActions(order)}
                onAction={(action) => onOrderAction?.(order.orderId, action)}
                showWorkflow={userRole === 'manager' || (order.approvalStages?.length ?? 0) > 0}
                collapsible={true}
                defaultExpanded={false}
                transformedId={activeOrderTab === 'archive' ? order.transformedId : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Build tabs array based on what should be shown
  const orderTabs = [];

  // Show "All Orders" tab first (except for warehouse)
  if (userRole !== 'warehouse') {
    orderTabs.push({ id: 'all', label: 'All Orders', count: allOrdersCount });
  }

  if (showServiceOrders) {
    orderTabs.push({ id: 'service', label: 'Service Orders', count: serviceOrdersCount });
  }
  if (showProductOrders) {
    orderTabs.push({ id: 'product', label: 'Product Orders', count: productOrdersCount });
  }
  orderTabs.push({ id: 'archive', label: archiveTabLabel, count: archiveCount });

  // Build action buttons based on user role and available callbacks
  const getActionButtons = () => {
    const buttons = [];

    // Request Service button - for contractor, customer, center (NOT warehouse per docs)
    if (onCreateServiceOrder && (userRole === 'contractor' || userRole === 'customer' || userRole === 'center')) {
      buttons.push(
        <Button
          key="service"
          variant="primary"
          roleColor="#14b8a6"  // Teal for services per CKS color codes
          onClick={onCreateServiceOrder}
        >
          Order Services
        </Button>
      );
    }

    // Request Products button - for contractor, customer, center, crew, manager (NOT warehouse per docs)
    if (onCreateProductOrder && !readOnlyProduct &&
        (userRole === 'contractor' || userRole === 'customer' || userRole === 'center' || userRole === 'crew' || userRole === 'manager')) {
      buttons.push(
        <Button
          key="product"
          variant="primary"
          roleColor="#d946ef"  // Magenta for products per CKS color codes
          onClick={onCreateProductOrder}
        >
          Order Products
        </Button>
      );
    }

    return buttons.length > 0 ? <div style={{ display: 'flex', gap: '8px' }}>{buttons}</div> : undefined;
  };

  return (
    <div className={styles.ordersSection}>
      <TabSection
        tabs={orderTabs}
        activeTab={activeOrderTab}
        onTabChange={(tabId) => {
          setActiveOrderTab(tabId);
          setSearchQuery('');
        }}
        description={getTabDescription()}
        searchPlaceholder={
          activeOrderTab === 'all'
            ? 'Search all orders...'
            : activeOrderTab === 'archive'
            ? archiveSearchPlaceholder
            : `Search ${activeOrderTab} orders...`
        }
        onSearch={setSearchQuery}
        actionButton={getActionButtons()}
        primaryColor={primaryColor}
        contentPadding="flush"
      >
        {/* Order Cards Display Area - No sub-tabs for consistent spacing */}
        <div style={{ padding: '16px' }}>
          {renderOrderCards(getDisplayOrders)}
        </div>
      </TabSection>
    </div>
  );
};

export default OrdersSection;
