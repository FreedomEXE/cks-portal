/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Contractor Hub - FULLY INDEPENDENT)
 * 
 * Description: Contractor-specific logout button component with session cleanup
 * Function: Handles user logout with Contractor-specific session management
 * Importance: Critical - Secure logout functionality for Contractor hub
 * Connects to: Clerk authentication, Contractor session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Contractor-specific cleanup.
 *        Clears Contractor session data before redirecting to login.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function ContractorLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearContractorSessionData = () => {
    const contractorKeys = [
      'contractor:session',
      'contractor:lastCode',
      'role',
      'code',
      'me:lastRole',
      'me:lastCode'
    ];

    contractorKeys.forEach(key => {
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
      
      // Clear Contractor session data
      clearContractorSessionData();

      // Clerk signOut with redirect URL - this ensures proper logout flow
      if (typeof signOut === 'function') {
        await signOut({ redirectUrl: '/login' });
        return; // signOut with redirectUrl handles the navigation
      }

      // Fallback: Force navigate to login if signOut doesn't redirect
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('[Contractor Logout] Error:', error);
      
      // Ensure we redirect even if signOut fails
      clearContractorSessionData();
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
        backgroundColor: '#10b981', // Contractor green
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.6 : 1,
        ...style 
      }}
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      aria-label="Sign out of Contractor Hub"
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}