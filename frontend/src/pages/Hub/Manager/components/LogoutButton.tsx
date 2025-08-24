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

import UniversalLogoutButton from '../../../../components/shared/UniversalLogoutButton';

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
  return (
    <UniversalLogoutButton 
      hubType="manager"
      style={style}
      className={className}
    >
      {children}
    </UniversalLogoutButton>
  );
}