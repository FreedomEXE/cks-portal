/*───────────────────────────────────────────────
  Property of CKS  © 2025  
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * UniversalLogoutButton.tsx
 * 
 * Description: Universal logout component that works across all hubs
 * Function: Handles complete logout with thorough session cleanup
 * Importance: Critical - Ensures proper logout functionality system-wide
 * Connects to: Clerk authentication, all hub session storage, navigation
 * 
 * Notes: Comprehensive logout that clears all possible session data,
 *        handles Clerk edge cases, and ensures proper redirect to login.
 *        Works for all hub types with theme-specific styling.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type LogoutButtonProps = {
  hubType?: 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew';
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

const HUB_COLORS = {
  admin: '#000000',
  manager: '#3b82f6', 
  contractor: '#10b981',
  customer: '#eab308',
  center: '#f97316',
  crew: '#ef4444'
};

export default function UniversalLogoutButton({ 
  hubType = 'admin',
  style, 
  className = "ui-button", 
  children = "Log out" 
}: LogoutButtonProps) {
  const navigate = useNavigate();
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearAllSessionData = () => {
    const keysToRemove = [
      // Generic session keys
      'me:lastRole',
      'me:lastCode', 
      'dev:signedOut',
      'role',
      'code',
      
      // Hub-specific session keys
      'admin:session',
      'admin:lastCode',
      'manager:session',
      'manager:lastCode',
      'contractor:session', 
      'contractor:lastCode',
      'customer:session',
      'customer:lastCode',
      'center:session',
      'center:lastCode', 
      'crew:session',
      'crew:lastCode',
      'crew:lastCrew',
      'crew:centerId',
    ];

    // Clear sessionStorage
    keysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    });

    // Clear localStorage  
    keysToRemove.forEach(key => {
      try {
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
      
      // Clear all session data immediately
      clearAllSessionData();

      // Clerk signOut
      if (typeof signOut === 'function') {
        await signOut();
      }

      // Force navigate to login
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('[Universal Logout] Error:', error);
      
      // Ensure we still redirect even if everything fails
      clearAllSessionData();
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
        backgroundColor: HUB_COLORS[hubType],
        color: hubType === 'customer' ? 'black' : 'white',
        border: 'none',
        borderRadius: 6,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.6 : 1,
        ...style 
      }}
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      aria-label={`Sign out of ${hubType} Hub`}
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}