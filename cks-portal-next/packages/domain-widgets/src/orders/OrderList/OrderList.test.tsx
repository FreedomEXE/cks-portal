/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: OrderList.test.tsx
 *
 * Description:
 * Unit tests for OrderList component
 *
 * Responsibilities:
 * - Test order display and filtering functionality
 * - Verify user interactions and callbacks
 *
 * Role in system:
 * - Used by Jest to ensure component quality
 *
 * Notes:
 * Tests various order states and user scenarios
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderList, Order } from './OrderList';

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'pending',
    customerName: 'John Doe',
    serviceType: 'Landscaping',
    totalAmount: 1500,
    createdAt: new Date('2025-01-01'),
    dueDate: new Date('2025-01-15'),
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    status: 'completed',
    customerName: 'Jane Smith',
    serviceType: 'Tree Removal',
    totalAmount: 2500,
    createdAt: new Date('2024-12-15'),
  },
];

const defaultProps = {
  orders: mockOrders,
  onOrderSelect: jest.fn(),
};

describe('OrderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders orders correctly', () => {
    render(<OrderList {...defaultProps} />);

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<OrderList {...defaultProps} loading={true} />);

    expect(screen.getByText('ORD-001')).not.toBeInTheDocument();
    expect(screen.getAllByRole('generic')).toHaveLength(6); // 5 skeleton items + container
  });

  it('calls onOrderSelect when order is clicked', () => {
    const onOrderSelect = jest.fn();
    render(<OrderList {...defaultProps} onOrderSelect={onOrderSelect} />);

    fireEvent.click(screen.getByText('ORD-001'));
    expect(onOrderSelect).toHaveBeenCalledWith(mockOrders[0]);
  });

  it('filters orders by status', () => {
    render(<OrderList {...defaultProps} />);

    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
  });

  it('hides filters when showFilters is false', () => {
    render(<OrderList {...defaultProps} showFilters={false} />);

    expect(screen.queryByDisplayValue('All Status')).not.toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    render(<OrderList {...defaultProps} orders={[]} />);

    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    const availableActions = [
      {
        id: 'approve',
        label: 'Approve',
        onClick: jest.fn(),
      },
    ];

    render(<OrderList {...defaultProps} availableActions={availableActions} />);

    expect(screen.getAllByText('Approve')).toHaveLength(2);
  });

  it('calls action onClick when button is clicked', () => {
    const onClick = jest.fn();
    const availableActions = [
      {
        id: 'approve',
        label: 'Approve',
        onClick,
      },
    ];

    render(<OrderList {...defaultProps} availableActions={availableActions} />);

    fireEvent.click(screen.getAllByText('Approve')[0]);
    expect(onClick).toHaveBeenCalledWith(mockOrders[0]);
  });
});