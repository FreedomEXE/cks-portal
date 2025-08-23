/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (CenterHub - FULLY INDEPENDENT)
 * 
 * Description: Center hub router with complete independence from shared components
 * Function: Routes all Center hub functionality through single Home component
 * Importance: Critical - Entry point for complete Center hub system
 * Connects to: Center Home component only, Center authentication, Center API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Center functionality consolidated into Home component.
 *        Uses Center-specific authentication and session management.
 *        Perfect template for center operations architecture.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CenterHome from './Home';

export default function CenterHub() {
  return (
    <Routes>
      {/* All Center functionality in single Home component */}
      <Route path="/" element={<CenterHome />} />
      <Route path="/profile" element={<CenterHome />} />
      <Route path="/dashboard" element={<CenterHome />} />
      <Route path="/crew" element={<CenterHome />} />
      <Route path="/services" element={<CenterHome />} />
      <Route path="/schedules" element={<CenterHome />} />
      <Route path="/reports" element={<CenterHome />} />
      <Route path="/support" element={<CenterHome />} />
      
      {/* Legacy routes redirect to home */}
      <Route path="/jobs" element={<CenterHome />} />
      <Route path="/documents" element={<CenterHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}