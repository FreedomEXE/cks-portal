/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (Center Hub)
 * 
 * Description: Single entry point and router for the Center hub module
 * Function: Routes all center-related pages and exports hub components
 * Importance: Critical - Defines center hub structure and navigation
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

// Main router for the Center hub
export default function CenterHub() {
  return (
    <Routes>
      <Route path="" element={<Home />} />
      <Route path="profile" element={<MyProfile />} />  {/* MyProfile handles data fetching */}
      {/* Future routes can be added here */}
    </Routes>
  );
}

// Named exports for backward compatibility or external use
export { Profile as CenterProfile };  // This exports ./Profile.tsx as CenterProfile
export { Home as CenterHome };