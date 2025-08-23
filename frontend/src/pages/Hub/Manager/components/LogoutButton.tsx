/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Manager Hub - FULLY INDEPENDENT)
 * 
 * Description: Manager-specific logout button component with session cleanup
 * Function: Handles user logout with Manager-specific session management
 * Importance: Critical - Secure logout functionality for Manager hub
 * Connects to: Clerk authentication, Manager session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Manager-specific cleanup.
 *        Clears Manager session data before redirecting to login.
 *        Uses Manager-specific styling to match hub theme.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearManagerSession } from '../utils/managerAuth';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function ManagerLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear Manager-specific session data
      clearManagerSession();
      
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
      console.warn('[ManagerLogout] Sign out error:', error);
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
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleLogout}
      aria-label="Sign out of Manager Hub"
      title="Sign out"
    >
      {children}
    </button>
  );
}