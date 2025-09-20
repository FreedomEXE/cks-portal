/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: AccountManagerTab.tsx
 *
 * Description:
 * Account manager tab content component
 *
 * Responsibilities:
 * - Display account manager information
 * - Provide contact and meeting scheduling buttons
 *
 * Role in system:
 * - Account manager display within ProfileInfoCard
 *
 * Notes:
 * Only shown for non-manager roles
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';
import Button from '../../../../ui/src/buttons/Button';

export interface AccountManagerInfo {
  name: string;
  id: string;
  email: string;
  phone: string;
}

export interface AccountManagerTabProps {
  accountManager: AccountManagerInfo | null;
  primaryColor: string;
  onContactManager?: () => void;
  onScheduleMeeting?: () => void;
}

export function AccountManagerTab({
  accountManager,
  primaryColor,
  onContactManager,
  onScheduleMeeting
}: AccountManagerTabProps) {
  if (!accountManager) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: 16 }}>
          No account manager assigned
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {/* Manager Avatar - Left Side */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: '#6b7280',
          fontWeight: 'bold',
          marginBottom: 16
        }}>
          {accountManager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>

      {/* Manager Info - Right Side */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            <tr>
              <td style={{
                fontSize: 16,
                color: '#111827',
                fontWeight: 500,
                width: '200px',
                verticalAlign: 'top'
              }}>
                Manager Name
              </td>
              <td style={{
                fontSize: 16,
                color: '#111827'
              }}>
                {accountManager.name}
              </td>
            </tr>
            <tr>
              <td style={{
                fontSize: 16,
                color: '#111827',
                fontWeight: 500,
                width: '200px',
                verticalAlign: 'top'
              }}>
                Manager ID
              </td>
              <td style={{
                fontSize: 16,
                color: '#111827'
              }}>
                {accountManager.id}
              </td>
            </tr>
            <tr>
              <td style={{
                fontSize: 16,
                color: '#111827',
                fontWeight: 500,
                width: '200px',
                verticalAlign: 'top'
              }}>
                Email
              </td>
              <td style={{
                fontSize: 16,
                color: '#111827'
              }}>
                {accountManager.email}
              </td>
            </tr>
            <tr>
              <td style={{
                fontSize: 16,
                color: '#111827',
                fontWeight: 500,
                width: '200px',
                verticalAlign: 'top'
              }}>
                Phone
              </td>
              <td style={{
                fontSize: 16,
                color: '#111827'
              }}>
                {accountManager.phone}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <Button
            variant="primary"
            onClick={onContactManager}
            roleColor={primaryColor}
          >
            Contact Manager
          </Button>
          <Button
            variant="secondary"
            onClick={onScheduleMeeting}
          >
            Schedule Meeting
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AccountManagerTab;