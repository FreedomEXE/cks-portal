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
 * Notes: Independent logout handling specific to Admin hub requirements.
 *        Clears all Admin session data and redirects to login.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearAdminSessionData = () => {
    const adminKeys = [
      'admin:session',
      'admin:lastCode',
      'role',
      'code',
      'me:lastRole',
      'me:lastCode'
    ];

    adminKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      } catch {}
    });
  };

  const handleLogout = async () => {
    if (isLoggingOut || !isLoaded) return;
    
    setIsLoggingOut(true);

    try {
      // Set logout flag to prevent auto re-login
      localStorage.setItem('userLoggedOut', 'true');
      
      // Clear Admin session data
      clearAdminSessionData();

      // Clerk signOut
      if (typeof signOut === 'function') {
        await signOut();
      }

      // Force navigate to login
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('[Admin Logout] Error:', error);
      
      // Ensure we redirect even if signOut fails
      clearAdminSessionData();
      localStorage.setItem('userLoggedOut', 'true');
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      className={className}
      style={{ 
        padding: '10px 16px', 
        fontSize: 14,
        backgroundColor: '#000000', // Admin black
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.6 : 1,
        ...style 
      }}
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      aria-label="Sign out of Admin Hub"
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}