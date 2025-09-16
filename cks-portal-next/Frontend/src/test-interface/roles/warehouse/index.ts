import React from 'react';

export const config = { role: 'warehouse', version: '1.0.0-test' };
export const components = {
  Dashboard: () => <div>Warehouse Dashboard (Test)</div>,
  MyProfile: () => <div>Warehouse Profile (Test)</div>,
  Inventory: () => <div>Inventory (Test)</div>,
  OrderProcessing: () => <div>Order Processing (Test)</div>,
  DeliveryTracking: () => <div>Delivery Tracking (Test)</div>,
  Reports: () => <div>Reports (Test)</div>,
  Support: () => <div>Support (Test)</div>
};
export default { config, components };