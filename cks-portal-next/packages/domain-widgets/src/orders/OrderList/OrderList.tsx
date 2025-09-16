/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: OrderList.tsx
 *
 * Description:
 * Order listing component with filtering and sorting capabilities
 *
 * Responsibilities:
 * - Display list of orders with status and details
 * - Provide filtering and sorting functionality
 * - Handle order selection and actions
 *
 * Role in system:
 * - Used by multiple roles to view and manage orders
 *
 * Notes:
 * Role-aware but agnostic - behavior changes based on user context
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/

import React, { useState } from 'react';
import { clsx } from 'clsx';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  serviceType: string;
  totalAmount: number;
  createdAt: Date;
  dueDate?: Date;
}

export interface OrderListProps {
  /**
   * Array of orders to display
   */
  orders: Order[];

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Callback when order is selected
   */
  onOrderSelect?: (order: Order) => void;

  /**
   * Available actions based on user role
   */
  availableActions?: Array<{
    id: string;
    label: string;
    onClick: (order: Order) => void;
    disabled?: (order: Order) => boolean;
  }>;

  /**
   * Show filters
   */
  showFilters?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading = false,
  onOrderSelect,
  availableActions = [],
  showFilters = true,
  className,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'totalAmount') {
      return b.totalAmount - a.totalAmount;
    }
    return a.orderNumber.localeCompare(b.orderNumber);
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="totalAmount">Sort by Amount</option>
            <option value="orderNumber">Sort by Order #</option>
          </select>
        </div>
      )}

      <div className="space-y-2">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No orders found
          </div>
        ) : (
          sortedOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onOrderSelect?.(order)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {order.orderNumber}
                    </h3>
                    <span
                      className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(order.status)
                      )}
                    >
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Customer: {order.customerName}</div>
                    <div>Service: {order.serviceType}</div>
                    <div>Amount: ${order.totalAmount.toLocaleString()}</div>
                    <div>Created: {order.createdAt.toLocaleDateString()}</div>
                    {order.dueDate && (
                      <div>Due: {order.dueDate.toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {availableActions.length > 0 && (
                  <div className="flex gap-2">
                    {availableActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(order);
                        }}
                        disabled={action.disabled?.(order)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};