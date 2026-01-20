import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { useSWRConfig } from 'swr';
import { updateUserProfile, type UserProfileUpdatePayload } from '../../../shared/api/admin';

type UserEntityType = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

type FieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'mainContact'
  | 'emergencyContact'
  | 'territory'
  | 'reportsTo';

type FieldConfig = {
  key: FieldKey;
  label: string;
  placeholder?: string;
};

const FIELD_CONFIG: Record<UserEntityType, FieldConfig[]> = {
  manager: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'territory', label: 'Territory' },
    { key: 'reportsTo', label: 'Reports To' },
  ],
  contractor: [
    { key: 'name', label: 'Name' },
    { key: 'mainContact', label: 'Main Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  customer: [
    { key: 'name', label: 'Name' },
    { key: 'mainContact', label: 'Main Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  center: [
    { key: 'name', label: 'Name' },
    { key: 'mainContact', label: 'Main Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  crew: [
    { key: 'name', label: 'Name' },
    { key: 'emergencyContact', label: 'Emergency Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
  warehouse: [
    { key: 'name', label: 'Name' },
    { key: 'mainContact', label: 'Main Contact' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
  ],
};

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export interface UserEditTabProps {
  entityType: UserEntityType;
  entityId: string;
  entityData: any;
}

export default function UserEditTab({ entityType, entityId, entityData }: UserEditTabProps) {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();
  const fields = FIELD_CONFIG[entityType];

  const initialValues = useMemo(() => {
    const values: Record<FieldKey, string> = {
      name: normalizeValue(entityData?.name),
      email: normalizeValue(entityData?.email),
      phone: normalizeValue(entityData?.phone),
      address: normalizeValue(entityData?.address),
      mainContact: normalizeValue(entityData?.mainContact),
      emergencyContact: normalizeValue(entityData?.emergencyContact),
      territory: normalizeValue(entityData?.territory),
      reportsTo: normalizeValue(entityData?.reportsTo),
    };
    return values;
  }, [entityData]);

  const [formValues, setFormValues] = useState<Record<FieldKey, string>>(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const isDirty = fields.some((field) => formValues[field.key] !== initialValues[field.key]);

  const buildPayload = (): UserProfileUpdatePayload => {
    const payload: UserProfileUpdatePayload = {};
    fields.forEach((field) => {
      if (formValues[field.key] !== initialValues[field.key]) {
        payload[field.key] = formValues[field.key].trim() || null;
      }
    });
    return payload;
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast('No changes to save.');
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile(entityType, entityId, payload, { getToken });
      toast.success('Profile updated');
      mutate((key: any) => {
        if (typeof key === 'string') {
          return key.includes('/admin/directory') ||
            key.includes('/profile/') ||
            key.includes(entityId);
        }
        return false;
      });
      window.dispatchEvent(new CustomEvent('cks:modal:refresh'));
    } catch (error: any) {
      console.error('[UserEditTab] Update failed', error);
      toast.error(error?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 14, color: '#64748b' }}>
        Update profile fields for this user. Changes save immediately.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {fields.map((field) => (
          <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 600, letterSpacing: '0.02em' }}>
              {field.label}
            </span>
            <input
              value={formValues[field.key]}
              onChange={(event) =>
                setFormValues((prev) => ({ ...prev, [field.key]: event.target.value }))
              }
              placeholder={field.placeholder}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            />
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          style={{
            borderRadius: 8,
            border: 'none',
            background: saving || !isDirty ? '#cbd5f5' : '#4f46e5',
            color: 'white',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
