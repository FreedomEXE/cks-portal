/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (ManagerHub)
 * 
 * Description: FULLY INDEPENDENT and DEDICATED Manager hub router/security system
 * Function: Handles ALL Manager hub's routes & security internally - no external routing dependencies
 * Importance: High - Complete self-contained Manager hub
 * Connects to: Home.tsx, Profile.tsx and all Manager-specific pages
 * 
 * Notes: Later on code will also be added to handle all Manager Hub's security features 
 * Built to be future proof, Architecturally intelligent and secure 
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerHome from './Home';
import ManagerProfile from './Profile';
import Page from '../../../components/Page';

/**
 * Placeholder for Manager features not yet implemented
 */
const Placeholder = ({ title }: { title: string }) => (
  <Page title={title}>
    <div className="ui-card" style={{ padding: 16 }}>
      Manager {title} - Coming soon
    </div>
  </Page>
);

export default function ManagerHub() {
  return (
    <Routes>
      {/* Main Manager routes */}
      <Route path="/" element={<ManagerHome />} />
      <Route path="/profile" element={<ManagerProfile />} />
      
      {/* Manager-specific sections */}
      <Route path="/centers" element={<Placeholder title="Centers" />} />
      <Route path="/services" element={<Placeholder title="Services" />} />
      <Route path="/jobs" element={<Placeholder title="Jobs" />} />
      <Route path="/contractors" element={<Placeholder title="Contractors" />} />
      <Route path="/crew" element={<Placeholder title="Crew" />} />
      <Route path="/documents" element={<Placeholder title="Documents" />} />
      <Route path="/support" element={<Placeholder title="Support" />} />
      <Route path="/reports" element={<Placeholder title="Reports" />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}