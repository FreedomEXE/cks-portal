/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Crew Hub - FULLY INDEPENDENT)
 * 
 * Description: Crew-specific logout button component with session cleanup
 * Function: Handles user logout with Crew-specific session management
 * Importance: Critical - Secure logout functionality for Crew hub
 * Connects to: Clerk authentication, Crew session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Crew-specific cleanup.
 *        Clears Crew session data before redirecting to login.
 *        Uses Crew-specific styling to match hub theme.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearCrewSession } from '../utils/crewAuth';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function CrewLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear Crew-specific session data
      clearCrewSession();
      
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
      console.warn('[CrewLogout] Sign out error:', error);
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
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleLogout}
      aria-label="Sign out of Crew Hub"
      title="Sign out"
    >
      {children}
    </button>
  );
}