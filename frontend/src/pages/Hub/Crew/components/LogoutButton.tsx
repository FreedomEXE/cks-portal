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
 * Connects to: Universal logout component with Crew hub styling
 * 
 * Notes: Uses the universal logout component for consistent behavior
 *        across all hubs while maintaining Crew-specific appearance.
 */

import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  const { signOut, isLoaded } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearCrewSessionData = () => {
    const crewKeys = [
      'crew:session',
      'crew:lastCode',
      'crew:lastCrew',
      'crew:centerId',
      'role',
      'code',
      'me:lastRole',
      'me:lastCode'
    ];

    crewKeys.forEach(key => {
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
      
      // Clear Crew session data
      clearCrewSessionData();

      // Clerk signOut - try with redirect URL first, then force navigate
      if (typeof signOut === 'function') {
        try {
          await signOut({ redirectUrl: '/login' });
        } catch (signOutError) {
          console.error('[Crew Logout] SignOut with redirect failed:', signOutError);
        }
      }

      // Force navigate to login regardless (ensures logout works even if Clerk redirect fails)
      navigate('/login', { replace: true });

    } catch (error) {
      console.error('[Crew Logout] Error:', error);
      
      // Ensure we redirect even if signOut fails
      clearCrewSessionData();
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
        backgroundColor: '#ef4444', // Crew red
        color: 'white',
        border: 'none',
        borderRadius: 6,
        cursor: isLoggingOut ? 'not-allowed' : 'pointer',
        opacity: isLoggingOut ? 0.6 : 1,
        ...style 
      }}
      onClick={handleLogout}
      disabled={isLoggingOut || !isLoaded}
      aria-label="Sign out of Crew Hub"
      title="Sign out"
    >
      {isLoggingOut ? 'Signing out...' : children}
    </button>
  );
}