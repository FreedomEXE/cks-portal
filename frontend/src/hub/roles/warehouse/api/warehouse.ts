/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * warehouse.ts
 * 
 * Description: Warehouse-specific API client for backend communication
 * Function: Provides warehouse-specific API calls and data fetching
 * Importance: Critical - Primary API interface for Warehouse hub
 * Connects to: Warehouse backend endpoints, authentication, data hooks
 * 
 * Notes: Warehouse-specific version of manager API client.
 *        Handles inventory management, order fulfillment, and logistics.
 *        Isolated from other role APIs for security and maintainability.
 */

import { buildWarehouseApiUrl, warehouseApiFetch } from '../utils/warehouseApi';

// Warehouse profile management
export async function getWarehouseProfile(warehouseId: string) {
  const url = buildWarehouseApiUrl('/profile', { code: warehouseId });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse profile: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateWarehouseProfile(warehouseId: string, profileData: any) {
  const url = buildWarehouseApiUrl('/profile');
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update warehouse profile: ${response.status}`);
  }
  
  return await response.json();
}

// Inventory management
export async function getInventoryItems(warehouseId: string, filters: any = {}) {
  const url = buildWarehouseApiUrl('/inventory', { code: warehouseId, ...filters });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory items: ${response.status}`);
  }
  
  return await response.json();
}

export async function getInventoryItem(itemId: string) {
  const url = buildWarehouseApiUrl(`/inventory/${itemId}`);
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory item: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateInventoryItem(itemId: string, itemData: any) {
  const url = buildWarehouseApiUrl(`/inventory/${itemId}`);
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(itemData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update inventory item: ${response.status}`);
  }
  
  return await response.json();
}

export async function adjustInventory(itemId: string, adjustmentData: any) {
  const url = buildWarehouseApiUrl(`/inventory/${itemId}/adjust`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adjustmentData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to adjust inventory: ${response.status}`);
  }
  
  return await response.json();
}

// Order management
export async function getWarehouseOrders(warehouseId: string, filters: any = {}) {
  const url = buildWarehouseApiUrl('/orders', { code: warehouseId, ...filters });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse orders: ${response.status}`);
  }
  
  return await response.json();
}

export async function getOrderDetails(orderId: string) {
  const url = buildWarehouseApiUrl(`/orders/${orderId}`);
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch order details: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  const url = buildWarehouseApiUrl(`/orders/${orderId}/status`);
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.status}`);
  }
  
  return await response.json();
}

export async function assignOrderPicker(orderId: string, pickerId: string) {
  const url = buildWarehouseApiUrl(`/orders/${orderId}/assign`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ picker_id: pickerId })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to assign order picker: ${response.status}`);
  }
  
  return await response.json();
}

// Receiving and put-away
export async function createReceivingOrder(warehouseId: string, receivingData: any) {
  const url = buildWarehouseApiUrl('/receiving');
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ warehouse_id: warehouseId, ...receivingData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create receiving order: ${response.status}`);
  }
  
  return await response.json();
}

export async function receiveInventory(receivingId: string, receiptData: any) {
  const url = buildWarehouseApiUrl(`/receiving/${receivingId}/receive`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(receiptData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to receive inventory: ${response.status}`);
  }
  
  return await response.json();
}

export async function putAwayInventory(itemId: string, putAwayData: any) {
  const url = buildWarehouseApiUrl(`/inventory/${itemId}/putaway`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(putAwayData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to put away inventory: ${response.status}`);
  }
  
  return await response.json();
}

// Picking and packing
export async function generatePickList(warehouseId: string, orderIds: string[]) {
  const url = buildWarehouseApiUrl('/picking/generate');
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ warehouse_id: warehouseId, order_ids: orderIds })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate pick list: ${response.status}`);
  }
  
  return await response.json();
}

export async function recordPick(pickId: string, pickData: any) {
  const url = buildWarehouseApiUrl(`/picking/${pickId}/record`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pickData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to record pick: ${response.status}`);
  }
  
  return await response.json();
}

export async function packOrder(orderId: string, packingData: any) {
  const url = buildWarehouseApiUrl(`/orders/${orderId}/pack`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(packingData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to pack order: ${response.status}`);
  }
  
  return await response.json();
}

// Shipping and tracking
export async function createShipment(warehouseId: string, shipmentData: any) {
  const url = buildWarehouseApiUrl('/shipping/create');
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ warehouse_id: warehouseId, ...shipmentData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create shipment: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateShipmentTracking(shipmentId: string, trackingData: any) {
  const url = buildWarehouseApiUrl(`/shipping/${shipmentId}/tracking`);
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(trackingData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update shipment tracking: ${response.status}`);
  }
  
  return await response.json();
}

// Zone and location management
export async function getWarehouseZones(warehouseId: string) {
  const url = buildWarehouseApiUrl('/zones', { code: warehouseId });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse zones: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateZoneConfiguration(zoneId: string, zoneData: any) {
  const url = buildWarehouseApiUrl(`/zones/${zoneId}`);
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(zoneData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update zone configuration: ${response.status}`);
  }
  
  return await response.json();
}

export async function getLocationDetails(locationCode: string) {
  const url = buildWarehouseApiUrl(`/locations/${locationCode}`);
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch location details: ${response.status}`);
  }
  
  return await response.json();
}

// Equipment management
export async function getWarehouseEquipment(warehouseId: string) {
  const url = buildWarehouseApiUrl('/equipment', { code: warehouseId });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse equipment: ${response.status}`);
  }
  
  return await response.json();
}

export async function updateEquipmentStatus(equipmentId: string, status: string, notes?: string) {
  const url = buildWarehouseApiUrl(`/equipment/${equipmentId}/status`);
  const response = await warehouseApiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update equipment status: ${response.status}`);
  }
  
  return await response.json();
}

export async function scheduleEquipmentMaintenance(equipmentId: string, maintenanceData: any) {
  const url = buildWarehouseApiUrl(`/equipment/${equipmentId}/maintenance`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(maintenanceData)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to schedule equipment maintenance: ${response.status}`);
  }
  
  return await response.json();
}

// Reports and metrics
export async function getWarehouseMetrics(warehouseId: string, period: string = '30d') {
  const url = buildWarehouseApiUrl('/metrics', { code: warehouseId, period });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch warehouse metrics: ${response.status}`);
  }
  
  return await response.json();
}

export async function getInventoryReport(warehouseId: string, reportType: string) {
  const url = buildWarehouseApiUrl('/reports/inventory', { code: warehouseId, type: reportType });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory report: ${response.status}`);
  }
  
  return await response.json();
}

export async function getPerformanceReport(warehouseId: string, startDate: string, endDate: string) {
  const url = buildWarehouseApiUrl('/reports/performance', { 
    code: warehouseId, 
    start_date: startDate, 
    end_date: endDate 
  });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch performance report: ${response.status}`);
  }
  
  return await response.json();
}

// Activity and communications
export async function getWarehouseActivity(warehouseId: string, limit: number = 5) {
  const url = buildWarehouseApiUrl('/activity', { code: warehouseId, limit });
  const response = await warehouseApiFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch activity: ${response.status}`);
  }
  
  return await response.json();
}

export async function clearWarehouseActivity(warehouseId: string) {
  const url = buildWarehouseApiUrl('/clear-activity', { code: warehouseId });
  const response = await warehouseApiFetch(url, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to clear activity: ${response.status}`);
  }
  
  return await response.json();
}

// Cycle counting and audits
export async function initiateCycleCount(warehouseId: string, countData: any) {
  const url = buildWarehouseApiUrl('/cycle-count/initiate');
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ warehouse_id: warehouseId, ...countData })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to initiate cycle count: ${response.status}`);
  }
  
  return await response.json();
}

export async function recordCycleCount(countId: string, countResults: any) {
  const url = buildWarehouseApiUrl(`/cycle-count/${countId}/record`);
  const response = await warehouseApiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(countResults)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to record cycle count: ${response.status}`);
  }
  
  return await response.json();
}