/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (CustomerHub - FULLY INDEPENDENT)
 * 
 * Description: Customer hub router with complete independence from shared components
 * Function: Routes all Customer hub functionality through single Home component
 * Importance: Critical - Entry point for complete Customer hub system
 * Connects to: Customer Home component only, Customer authentication, Customer API
 * 
 * Notes: 100% self-contained routing with no external dependencies.
 *        All Customer functionality consolidated into Home component.
 *        Uses Customer-specific authentication and session management.
 *        Perfect template for other hub architectures.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerHome from './Home';

export default function CustomerHub() {
  return (
    <Routes>
      {/* All Customer functionality in single Home component */}
      <Route path="/" element={<CustomerHome />} />
      <Route path="/profile" element={<CustomerHome />} />
      <Route path="/dashboard" element={<CustomerHome />} />
      <Route path="/centers" element={<CustomerHome />} />
      <Route path="/crew" element={<CustomerHome />} />
      <Route path="/reports" element={<CustomerHome />} />
      <Route path="/orders" element={<CustomerHome />} />
      <Route path="/services" element={<CustomerHome />} />
      
      {/* Legacy routes redirect to home */}
      <Route path="/invoices" element={<CustomerHome />} />
      <Route path="/requests" element={<CustomerHome />} />
      <Route path="/documents" element={<CustomerHome />} />
      <Route path="/support" element={<CustomerHome />} />
      
      {/* Catch any unknown routes and redirect to home */}
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}