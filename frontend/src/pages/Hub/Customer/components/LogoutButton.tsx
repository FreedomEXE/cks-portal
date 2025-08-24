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
 * Connects to: Universal logout component with Customer hub styling
 * 
 * Notes: Uses the universal logout component for consistent behavior
 *        across all hubs while maintaining Customer-specific appearance.
 */

import UniversalLogoutButton from '../../../../components/shared/UniversalLogoutButton';

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
  return (
    <UniversalLogoutButton 
      hubType="customer"
      style={style}
      className={className}
    >
      {children}
    </UniversalLogoutButton>
  );
}