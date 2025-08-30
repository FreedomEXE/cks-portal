/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Warehouse Hub)
 * Handles proper Clerk sign-out and local session cleanup.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { clearWarehouseSession } from '../utils/warehouseAuth';

export default function WarehouseLogoutButton() {
  const navigate = useNavigate();
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearAll = () => {
    try {
      clearWarehouseSession();
      const keys = ['role','code','me:lastRole','me:lastCode'];
      keys.forEach(k => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch {} });
    } catch {}
  };

  const handleLogout = async () => {
    if (!isLoaded || isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      localStorage.setItem('userLoggedOut', 'true');
      clearAll();
      if (typeof signOut === 'function') {
        await signOut({ redirectUrl: '/login' });
        return;
      }
      navigate('/login', { replace: true });
    } catch (e) {
      clearAll();
      localStorage.setItem('userLoggedOut', 'true');
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      style={{
        padding: '8px 16px',
        backgroundColor: '#8b5cf6',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}
      onMouseEnter={(e) => {
        if (isLoggingOut) return;
        e.currentTarget.style.backgroundColor = '#7c3aed';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#8b5cf6';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: 16 }}>📦</span>
      {isLoggingOut ? 'Signing out...' : 'Logout'}
    </button>
  );
}
