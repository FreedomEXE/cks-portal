/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Center Hub - FULLY INDEPENDENT)
 * 
 * Description: Center-specific logout button component with session cleanup
 * Function: Handles user logout with Center-specific session management
 * Importance: Critical - Secure logout functionality for Center hub
 * Connects to: Clerk authentication, Center session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Center-specific cleanup.
 *        Clears Center session data before redirecting to login.
 *        Uses Center-specific styling to match hub theme.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearCenterSession } from '../utils/centerAuth';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function CenterLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear Center-specific session data
      clearCenterSession();
      
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
      console.warn('[CenterLogout] Sign out error:', error);
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
        backgroundColor: '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleLogout}
      aria-label="Sign out of Center Hub"
      title="Sign out"
    >
      {children}
    </button>
  );
}