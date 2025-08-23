/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Admin Hub - FULLY INDEPENDENT)
 * 
 * Description: Admin-specific logout button component with session cleanup
 * Function: Handles user logout with Admin-specific session management
 * Importance: Critical - Secure logout functionality for Admin hub
 * Connects to: Clerk authentication, Admin session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Admin-specific cleanup.
 *        Clears Admin session data before redirecting to login.
 *        Uses Admin-specific styling to match hub theme.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession } from '../utils/adminAuth';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function AdminLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear Admin-specific session data
      clearAdminSession();
      
      // Clear any shared session remnants
      try {
        localStorage.removeItem('me:lastRole');
        localStorage.removeItem('me:lastCode');
        localStorage.removeItem('dev:signedOut');
      } catch {}

      // Attempt Clerk sign out
      if (typeof signOut === 'function') {
        await signOut({ redirectUrl: '/login' });
        return;
      }
    } catch (error) {
      console.warn('[AdminLogout] Sign out error:', error);
    }
    
    // Fallback navigation
    navigate('/login', { replace: true });
  };

  return (
    <button
      className={className}
      style={{ 
        padding: '10px 16px', 
        fontSize: 14,
        backgroundColor: '#000000',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleLogout}
      aria-label="Sign out of Admin Hub"
      title="Sign out"
    >
      {children}
    </button>
  );
}