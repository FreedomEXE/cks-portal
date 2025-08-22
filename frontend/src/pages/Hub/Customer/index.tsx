/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Customer Hub Router)
 * 
 * Description: FULLY INDEPENDENT Customer hub router
 * Function: Routes to Home and Profile pages for customer users
 * Importance: High - Controls customer hub routing
 * Connects to: CustomerHome, CustomerProfile components
 * 
 * Notes: Profile component fetches its own data via useMeProfile
 */


import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerHome from './Home';
import CustomerProfile from './Profile';
import Page from '../../../components/Page';

/**
 * Placeholder for Customer features not yet implemented
 */
const Placeholder = ({ title }: { title: string }) => (
  <Page title={title}>
    <div className="ui-card" style={{ padding: 16 }}>
      Customer {title} - Coming soon
    </div>
  </Page>
);

export default function CustomerHub() {
  return (
    <Routes>
      {/* Main Customer routes */}
      <Route path="/" element={<CustomerHome />} />
      <Route path="/profile" element={<CustomerProfile />} />  {/* NO data prop! */}
      
      {/* Customer-specific sections */}
      <Route path="/centers" element={<Placeholder title="Centers" />} />
      <Route path="/services" element={<Placeholder title="Services" />} />
      <Route path="/invoices" element={<Placeholder title="Invoices" />} />
      <Route path="/reports" element={<Placeholder title="Reports" />} />
      <Route path="/requests" element={<Placeholder title="Requests" />} />
      <Route path="/documents" element={<Placeholder title="Documents" />} />
      <Route path="/support" element={<Placeholder title="Support" />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}