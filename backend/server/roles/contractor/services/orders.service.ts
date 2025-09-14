/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: orders.service.ts
 * 
 * Description: Order listing/creation; status transitions and side-effects.
 * Function: Handle contractor order operations and workflow management
 * Importance: Core business logic for contractor order processing
 * Connects to: orders.repo.ts, validators, activity.repo.ts.
 */

import * as ordersRepo from '../repositories/orders.repo';
import * as activityRepo from '../repositories/activity.repo';

// Get orders for contractor
export async function getOrders(contractorId: string, filters: any) {
  try {
    const orders = await ordersRepo.getOrdersForContractor(contractorId, filters);
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

// Get specific order by ID
export async function getOrderById(contractorId: string, orderId: string) {
  try {
    const order = await ordersRepo.getOrderById(contractorId, orderId);
    return order;
  } catch (error) {
    console.error('Error getting order:', error);
    throw new Error('Order not found');
  }
}

// Update order status
export async function updateOrder(contractorId: string, orderId: string, updateData: any) {
  try {
    const updatedOrder = await ordersRepo.updateOrder(contractorId, orderId, updateData);
    
    // Log the activity
    await activityRepo.logActivity({
      userId: contractorId,
      action: 'order_updated',
      entityType: 'order',
      entityId: orderId,
      description: `Order ${orderId} updated by contractor`,
      metadata: updateData
    });

    return updatedOrder;
  } catch (error) {
    console.error('Error updating order:', error);
    throw new Error('Failed to update order');
  }
}

// Accept order (contractor-specific action)
export async function acceptOrder(contractorId: string, orderId: string) {
  try {
    const acceptedOrder = await ordersRepo.updateOrder(contractorId, orderId, { 
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: contractorId
    });
    
    // Log the activity
    await activityRepo.logActivity({
      userId: contractorId,
      action: 'order_accepted',
      entityType: 'order',
      entityId: orderId,
      description: `Order ${orderId} accepted by contractor`,
      metadata: { acceptedAt: new Date() }
    });

    return acceptedOrder;
  } catch (error) {
    console.error('Error accepting order:', error);
    throw new Error('Failed to accept order');
  }
}

// Complete order (contractor-specific action)
export async function completeOrder(contractorId: string, orderId: string, completionData: any) {
  try {
    const completedOrder = await ordersRepo.updateOrder(contractorId, orderId, { 
      status: 'completed',
      completedAt: new Date(),
      completedBy: contractorId,
      ...completionData
    });
    
    // Log the activity
    await activityRepo.logActivity({
      userId: contractorId,
      action: 'order_completed',
      entityType: 'order',
      entityId: orderId,
      description: `Order ${orderId} completed by contractor`,
      metadata: { completedAt: new Date(), ...completionData }
    });

    return completedOrder;
  } catch (error) {
    console.error('Error completing order:', error);
    throw new Error('Failed to complete order');
  }
}