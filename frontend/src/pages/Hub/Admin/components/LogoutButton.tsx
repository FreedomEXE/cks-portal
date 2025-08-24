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
 * Connects to: Universal logout component with Admin hub styling
 * 
 * Notes: Uses the universal logout component for consistent behavior
 *        across all hubs while maintaining Admin-specific appearance.
 */

import UniversalLogoutButton from '../../../../components/shared/UniversalLogoutButton';

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
  return (
    <UniversalLogoutButton 
      hubType="admin"
      style={style}
      className={className}
    >
      {children}
    </UniversalLogoutButton>
  );
}