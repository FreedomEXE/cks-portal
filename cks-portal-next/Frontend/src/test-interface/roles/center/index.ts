import React from 'react';

export const config = { role: 'center', version: '1.0.0-test' };
export const components = {
  Dashboard: () => <div>Center Dashboard (Test)</div>,
  MyProfile: () => <div>Center Profile (Test)</div>,
  FacilityManagement: () => <div>Facility Management (Test)</div>,
  Maintenance: () => <div>Maintenance (Test)</div>,
  Visitors: () => <div>Visitors (Test)</div>,
  Reports: () => <div>Reports (Test)</div>,
  Support: () => <div>Support (Test)</div>
};
export default { config, components };