/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (CrewHub - FULLY INDEPENDENT)
 * 
 * Description: Crew hub router with complete independence from shared components
 * Function: Routes all Crew hub functionality through single Home component
 * Importance: Critical - Entry point for complete Crew hub system
 * Connects to: Crew Home component only, Crew authentication, Crew API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Crew functionality consolidated into Home component.
 *        Uses Crew-specific authentication and session management.
 *        Perfect template for other hub architectures.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CrewHome from './Home';

export default function CrewHub() {
  return (
    <Routes>
      {/* All Crew functionality in single Home component */}
      <Route path="/" element={<CrewHome />} />
      <Route path="/profile" element={<CrewHome />} />
      <Route path="/dashboard" element={<CrewHome />} />
      <Route path="/schedule" element={<CrewHome />} />
      <Route path="/tasks" element={<CrewHome />} />
      <Route path="/timecard" element={<CrewHome />} />
      <Route path="/training" element={<CrewHome />} />
      <Route path="/center" element={<CrewHome />} />
      <Route path="/services" element={<CrewHome />} />
      
      {/* Legacy routes redirect to home */}
      <Route path="/certifications" element={<CrewHome />} />
      <Route path="/timesheets" element={<CrewHome />} />
      <Route path="/performance" element={<CrewHome />} />
      <Route path="/tools" element={<CrewHome />} />
      <Route path="/documents" element={<CrewHome />} />
      <Route path="/support" element={<CrewHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}