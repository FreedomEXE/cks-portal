/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Crew Hub Router)
 * 
 * Description: Router for Crew hub navigation
 * Function: Routes to Home and Profile pages for crew members
 * Importance: High - Controls crew hub routing
 * Connects to: CrewHome, CrewProfile components
 * 
 * Notes: Follows simplified 3-file structure.
 *        Profile route uses local Profile component.
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CrewHome from './Home';
import CrewProfile from './Profile';

export default function CrewHub() {
  return (
    <Routes>
      <Route path="" element={<CrewHome />} />
      <Route path="profile" element={<CrewProfile />} />
    </Routes>
  );
}