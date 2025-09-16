import React from 'react';

export const config = { role: 'customer', version: '1.0.0-test' };
export const components = {
  Dashboard: () => <div>Customer Dashboard (Test)</div>,
  MyProfile: () => <div>Customer Profile (Test)</div>,
  Services: () => <div>Request Services (Test)</div>,
  Ecosystem: () => <div>Ecosystem (Test)</div>,
  Orders: () => <div>My Orders (Test)</div>,
  Reports: () => <div>Reports (Test)</div>,
  Support: () => <div>Support (Test)</div>
};
export default { config, components };