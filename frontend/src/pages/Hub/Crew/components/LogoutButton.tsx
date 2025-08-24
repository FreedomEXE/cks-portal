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

import UniversalLogoutButton from '../../../../components/shared/UniversalLogoutButton';

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
  return (
    <UniversalLogoutButton 
      hubType="crew"
      style={style}
      className={className}
    >
      {children}
    </UniversalLogoutButton>
  );
}