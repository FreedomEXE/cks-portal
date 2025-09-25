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
import { Button } from '@cks/ui';

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
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
      {/* Manager Photo Section - Left Side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          color: '#6b7280',
          fontWeight: 600,
          marginBottom: '20px',
          border: '3px solid #ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <span style={{ userSelect: 'none' }}>
            {accountManager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </span>
        </div>
      </div>

      {/* Manager Info - Right Side */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <table style={{ width: '100%', borderSpacing: 0 }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500,
                padding: '16px 24px 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                verticalAlign: 'top',
                width: '180px',
                minWidth: '180px'
              }}>
                Manager Name
              </td>
              <td style={{
                fontSize: '16px',
                color: '#111827',
                padding: '16px 0',
                verticalAlign: 'top'
              }}>
                {accountManager.name}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500,
                padding: '16px 24px 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                verticalAlign: 'top',
                width: '180px',
                minWidth: '180px'
              }}>
                Manager ID
              </td>
              <td style={{
                fontSize: '16px',
                color: '#111827',
                padding: '16px 0',
                verticalAlign: 'top'
              }}>
                {accountManager.id}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500,
                padding: '16px 24px 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                verticalAlign: 'top',
                width: '180px',
                minWidth: '180px'
              }}>
                Email
              </td>
              <td style={{
                fontSize: '16px',
                color: '#111827',
                padding: '16px 0',
                verticalAlign: 'top'
              }}>
                {accountManager.email}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: 500,
                padding: '16px 24px 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                verticalAlign: 'top',
                width: '180px',
                minWidth: '180px'
              }}>
                Phone
              </td>
              <td style={{
                fontSize: '16px',
                color: '#111827',
                padding: '16px 0',
                verticalAlign: 'top'
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
