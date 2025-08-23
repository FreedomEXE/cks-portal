/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (ContractorHub - FULLY INDEPENDENT)
 * 
 * Description: Contractor hub router with complete independence from shared components
 * Function: Routes all Contractor hub functionality through single Home component
 * Importance: Critical - Entry point for complete Contractor hub system
 * Connects to: Contractor Home component only, Contractor authentication, Contractor API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Contractor functionality consolidated into Home component.
 *        Uses Contractor-specific authentication and session management.
 *        Perfect template for other hub architectures.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ContractorHome from './Home';

export default function ContractorHub() {
  return (
    <Routes>
      {/* All Contractor functionality in single Home component */}
      <Route path="/" element={<ContractorHome />} />
      <Route path="/profile" element={<ContractorHome />} />
      <Route path="/dashboard" element={<ContractorHome />} />
      <Route path="/customers" element={<ContractorHome />} />
      <Route path="/centers" element={<ContractorHome />} />
      <Route path="/crew" element={<ContractorHome />} />
      <Route path="/reports" element={<ContractorHome />} />
      <Route path="/orders" element={<ContractorHome />} />
      
      {/* Legacy routes redirect to home */}
      <Route path="/services" element={<ContractorHome />} />
      <Route path="/equipment" element={<ContractorHome />} />
      <Route path="/jobs" element={<ContractorHome />} />
      <Route path="/documents" element={<ContractorHome />} />
      <Route path="/support" element={<ContractorHome />} />
      <Route path="/billing" element={<ContractorHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}