/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HubRoleRouter from './pages/HubRoleRouter';
import AfterSignIn from './pages/Auth/AfterSignIn';
import Login from './pages/Login';
import Logout from './pages/Logout';  

export default function App() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <div style={{ padding: '8px 16px 40px' }}>
        <Routes>
          {/* Public routes redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Navigate to="/login" replace />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />  
          <Route path="/auth/redirect" element={<AfterSignIn />} />
          
          {/* Hub system - all authenticated routes */}
          <Route path=":username/hub" element={<HubRoleRouter />} />
          <Route path=":username/hub/*" element={<HubRoleRouter />} />
        </Routes>
      </div>
    </div>
  );
}