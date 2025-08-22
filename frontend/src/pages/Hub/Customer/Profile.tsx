/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Customer Hub Router)
 * 
 * Description: Customer hub's own router
 * Function: Routes to Home and Profile for customers
 * Importance: Critical - Main routing for customer hub
 * 
 * Follows hub isolation principle - completely self-contained
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerHome from './Home';
import CustomerProfile from './Profile';

export default function CustomerHub() {
  return (
    <Routes>
      <Route path="/" element={<CustomerHome />} />
      <Route path="/profile" element={<CustomerProfile />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}