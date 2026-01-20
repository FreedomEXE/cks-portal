import { useEffect, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useSWRConfig } from 'swr';
import {
  fetchAccountManagement,
  updateAccountManagement,
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

export default function UserManagementTab({ entityType, entityId, entityData }: UserManagementTabProps) {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();
  const [accountStatus, setAccountStatus] = useState<AccountStatus>('active');
  const [accessTier, setAccessTier] = useState<AccessTier>('standard');
  const [saving, setSaving] = useState(false);

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
    </div>
  );
}
