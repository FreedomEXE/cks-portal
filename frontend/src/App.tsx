/**
 * App.tsx (simplified)
 * Retained routes only:
 *   / and /home -> /login
 *   /login (placeholder for Clerk-hosted page)
 *   /auth/redirect -> AfterSignIn (post-auth handoff)
 *   /:username/hub and /:username/hub/* -> HubRoleRouter
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import HubRoleRouter from './pages/Hub/HubRoleRouter';
import AfterSignIn from './pages/Auth/AfterSignIn';

export default function App() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
      <div style={{ padding: '8px 16px 40px' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/home" element={<Navigate to="/login" replace />} />
          {/* Placeholder element for /login so SPA does not show 404; actual Clerk UI may replace outside */}
          <Route path="/login" element={<div />} />
            <Route path="/auth/redirect" element={<AfterSignIn />} />
          {/* Hub routing */}
          <Route path=":username/hub" element={<HubRoleRouter />} />
          <Route path=":username/hub/*" element={<HubRoleRouter />} />
        </Routes>
      </div>
    </div>
  );
}
