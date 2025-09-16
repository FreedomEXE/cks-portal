import React from 'react';

export const config = { role: 'crew', version: '1.0.0-test' };
export const components = {
  Dashboard: () => <div>Crew Dashboard (Test)</div>,
  MyProfile: () => <div>Crew Profile (Test)</div>,
  Tasks: () => <div>My Tasks (Test)</div>,
  Schedule: () => <div>Schedule (Test)</div>,
  Equipment: () => <div>Equipment (Test)</div>,
  Reports: () => <div>Reports (Test)</div>,
  Support: () => <div>Support (Test)</div>
};
export default { config, components };