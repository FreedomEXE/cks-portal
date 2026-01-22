import { useEffect, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useSWRConfig } from 'swr';
import {
  fetchAccountManagement,
  updateAccountManagement,
  updateTestUserPassword,
  type AccountStatus,
  type AccessTier,
} from '../../../shared/api/admin';

type UserEntityType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export interface UserManagementTabProps {
  entityType: UserEntityType;
  entityId: string;
  entityData: any;
}

const ACCOUNT_STATUS_OPTIONS: Array<{ value: AccountStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
];

const TIER_OPTIONS: Array<{ value: AccessTier; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
];

function isTestAccount(entityId: string, email?: string | null) {
  const normalized = entityId.toUpperCase();
  if (normalized.includes('-TEST') || normalized.endsWith('-900')) {
    return true;
  }
  if (email && email.toLowerCase().includes('clerk_test')) {
    return true;
  }
  return false;
}

export default function UserManagementTab({ entityType, entityId, entityData }: UserManagementTabProps) {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active');
  const [accessTier, setAccessTier] = useState<AccessTier>('standard');
  const [saving, setSaving] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [testPasswordConfirm, setTestPasswordConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const { data, error, isLoading } = useSWR(
    `/admin/account-management/${entityType}/${entityId}`,
    () => fetchAccountManagement(entityType, entityId, { getToken }),
  );

  useEffect(() => {
    if (!data) {
      return;
    }
    if (data.accountStatus) {
      setAccountStatus(data.accountStatus as AccountStatus);
    } else if (entityData?.status) {
      setAccountStatus(entityData.status);
    }
    if (data.accessTier) {
      setAccessTier(data.accessTier);
    }
  }, [data, entityData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateAccountManagement(
        entityType,
        entityId,
        { accountStatus, accessTier },
        { getToken },
      );
      toast.success('Account updated');
      mutate((key: any) => {
        if (typeof key === 'string') {
          return key.includes('/admin/account-management') ||
            key.includes('/admin/directory') ||
            key.includes('/profile/') ||
            key.includes(entityId);
        }
        return false;
      });
      window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
    } catch (err: any) {
      console.error('[UserManagementTab] Update failed', err);
      toast.error(err?.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const canEditTestPassword = isTestAccount(entityId, entityData?.email ?? null);

  const handleUpdateTestPassword = async () => {
    if (!testPassword || testPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (testPassword !== testPasswordConfirm) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await updateTestUserPassword(
        {
          entityType,
          entityId,
          password: testPassword,
        },
        { getToken },
      );
      setTestPassword('');
      setTestPasswordConfirm('');
      toast.success('Test password updated.');
    } catch (err: any) {
      console.error('[UserManagementTab] Test password update failed', err);
      toast.error(err?.message || 'Failed to update test password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: '#64748b' }}>
        Manage subscription status and tier for this account.
      </div>

      {isLoading && (
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Loading management settings...</div>
      )}
      {error && (
        <div style={{ fontSize: 14, color: '#ef4444' }}>
          Failed to load management settings.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
            Account Status
          </span>
          <select
            value={accountStatus}
            onChange={(event) => setAccountStatus(event.target.value as AccountStatus)}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              background: 'white',
            }}
          >
            {ACCOUNT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
            Subscription Tier
          </span>
          <select
            value={accessTier}
            onChange={(event) => setAccessTier(event.target.value as AccessTier)}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 14,
              background: 'white',
            }}
          >
            {TIER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            borderRadius: 8,
            border: 'none',
            background: saving ? '#cbd5f5' : '#4f46e5',
            color: 'white',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {canEditTestPassword && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
            Test Account Password
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            Update the shared password for this test user. Changes apply immediately in Clerk.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
                New Password
              </span>
              <input
                type="password"
                value={testPassword}
                onChange={(event) => setTestPassword(event.target.value)}
                placeholder="Enter new password"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  background: 'white',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
                Confirm Password
              </span>
              <input
                type="password"
                value={testPasswordConfirm}
                onChange={(event) => setTestPasswordConfirm(event.target.value)}
                placeholder="Re-enter password"
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 14,
                  background: 'white',
                }}
              />
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="button"
              onClick={handleUpdateTestPassword}
              disabled={savingPassword}
              style={{
                borderRadius: 8,
                border: 'none',
                background: savingPassword ? '#cbd5f5' : '#0f172a',
                color: 'white',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: savingPassword ? 'not-allowed' : 'pointer',
              }}
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
