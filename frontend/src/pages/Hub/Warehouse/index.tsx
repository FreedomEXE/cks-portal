/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * index.tsx (WarehouseHub - FULLY INDEPENDENT)
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WarehouseHome from './Home';

export default function WarehouseHub() {
  return (
    <Routes>
      <Route path="/" element={<WarehouseHome />} />
      <Route path="/dashboard" element={<WarehouseHome />} />
      <Route path="/inventory" element={<WarehouseHome />} />
      <Route path="/orders" element={<WarehouseHome />} />
      <Route path="/shipments" element={<WarehouseHome />} />
      <Route path="/activity" element={<WarehouseHome />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

