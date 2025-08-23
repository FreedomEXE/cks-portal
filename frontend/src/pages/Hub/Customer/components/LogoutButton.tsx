/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * LogoutButton.tsx (Customer Hub - FULLY INDEPENDENT)
 * 
 * Description: Customer-specific logout button component with session cleanup
 * Function: Handles user logout with Customer-specific session management
 * Importance: Critical - Secure logout functionality for Customer hub
 * Connects to: Clerk authentication, Customer session storage, navigation
 * 
 * Notes: Fully self-contained logout logic with Customer-specific cleanup.
 *        Clears Customer session data before redirecting to login.
 *        Uses Customer-specific styling to match hub theme.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { clearCustomerSession } from '../utils/customerAuth';

type LogoutButtonProps = {
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function CustomerLogoutButton({ 
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      // Clear Customer-specific session data
      clearCustomerSession();
      
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
      console.warn('[CustomerLogout] Sign out error:', error);
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
        backgroundColor: '#eab308',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleLogout}
      aria-label="Sign out of Customer Hub"
      title="Sign out"
    >
      {children}
    </button>
  );
}