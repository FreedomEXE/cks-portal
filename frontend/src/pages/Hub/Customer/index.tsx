/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Customer Hub Router)
 * 
 * Description: Router for Customer hub navigation
 * Function: Routes to Home and Profile pages for customer users
 * Importance: High - Controls customer hub routing
 * Connects to: CustomerHome, CustomerProfile components
 * 
 * Notes: Follows simplified 3-file structure.
 *        Profile route uses local Profile component, not MyProfile.
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CustomerHome from './Home';
import CustomerProfile from './Profile';

export default function CustomerHub() {
  return (
    <Routes>
      <Route path="" element={<CustomerHome />} />
      <Route path="profile" element={<CustomerProfile data={{}} />} />
    </Routes>
  );
}