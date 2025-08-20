/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Contractor Hub)
 * 
 * Description: Single entry point and router for the Contractor hub module
 * Function: Routes all contractor-related pages and exports hub components
 * Importance: Critical - Defines contractor hub structure and navigation
 * Connects to: Home, Profile (via MyProfile page)
 * 
 * Notes: Profile route uses MyProfile page for data fetching.
 *        The Profile component is exported for external use.
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Profile from "./Profile";  // This is the Profile.tsx in this folder
import MyProfile from "../../../pages/MyProfile";  // For the route

// Main router for the Contractor hub
export default function ContractorHub() {
  return (
    <Routes>
      <Route path="" element={<Home />} />
      <Route path="profile" element={<MyProfile />} />  {/* MyProfile handles data fetching */}
      {/* Future routes can be added here */}
    </Routes>
  );
}

// Named exports for backward compatibility or external use
export { Profile as ContractorProfile };  // This exports ./Profile.tsx as ContractorProfile
export { Home as ContractorHome };