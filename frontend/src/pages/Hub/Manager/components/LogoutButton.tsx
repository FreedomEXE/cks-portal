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
 * Connects to: Universal logout component with Manager hub styling
 * 
 * Notes: Uses the universal logout component for consistent behavior
 *        across all hubs while maintaining Manager-specific appearance.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearManagerSessionData = () => {
    const managerKeys = [
      'manager:session',
      'manager:lastCode',
      'role',
      'code',
      'me:lastRole',
      'me:lastCode'
    ];

    managerKeys.forEach(key => {
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
      
      // Clear Manager session data
      clearManagerSessionData();

      // Clerk signOut with redirect URL - this ensures proper logout flow
      if (typeof signOut === 'function') {
        await signOut({ redirectUrl: '/login' });
        return; // signOut with redirectUrl handles the navigation
      }

      // Fallback: Force navigate to login if signOut doesn't redirect
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('[Manager Logout] Error:', error);
      
      // Ensure we redirect even if signOut fails
      clearManagerSessionData();
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
        backgroundColor: '#3b82f6', // Manager blue
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.6 : 1,
        ...style 
      }}
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      aria-label="Sign out of Manager Hub"
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}