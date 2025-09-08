/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (ManagerHub - FULLY INDEPENDENT)
 * 
 * Description: Manager hub router with complete independence from shared components
 * Function: Routes all Manager hub functionality through single Home component
 * Importance: Critical - Entry point for complete Manager hub system
 * Connects to: Manager Home component only, Manager authentication, Manager API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Manager functionality consolidated into Home component.
 *        Uses Manager-specific authentication and session management.
 *        Perfect template for other hub architectures.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerHome from './Home';

export default function ManagerHub() {
  return (
    <Routes>
      {/* All Manager functionality in single Home component */}
      <Route path="/" element={<ManagerHome />} />
      <Route path="profile" element={<ManagerHome />} />
      <Route path="dashboard" element={<ManagerHome />} />
      <Route path="reports" element={<ManagerHome />} />
      <Route path="news" element={<ManagerHome />} />
      
      
      {/* Legacy routes redirect to home */}
      <Route path="contractors" element={<ManagerHome />} />
      <Route path="centers" element={<ManagerHome />} />
      <Route path="crew" element={<ManagerHome />} />
      <Route path="services" element={<ManagerHome />} />
      <Route path="documents" element={<ManagerHome />} />
      <Route path="support" element={<ManagerHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
