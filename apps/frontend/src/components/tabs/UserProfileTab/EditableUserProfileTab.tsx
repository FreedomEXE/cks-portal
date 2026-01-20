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

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full Name',
  name: 'Name',
  managerId: 'Manager ID',
  contractorId: 'Contractor ID',
  customerId: 'Customer ID',
  centerId: 'Center ID',
  crewId: 'Crew ID',
  warehouseId: 'Warehouse ID',
  address: 'Address',
  phone: 'Phone',
  email: 'Email',
  territory: 'Territory',
  role: 'Role',
  reportsTo: 'Reports To',
  startDate: 'Start Date',
  website: 'Website',
  mainContact: 'Main Contact',
  emergencyContact: 'Emergency Contact',
};

const FIELD_TO_INPUT_KEY: Partial<Record<string, FieldKey>> = {
  fullName: 'name',
  name: 'name',
  email: 'email',
  phone: 'phone',
  address: 'address',
  mainContact: 'mainContact',
  emergencyContact: 'emergencyContact',
  territory: 'territory',
  reportsTo: 'reportsTo',
};

const EDITABLE_FIELDS = new Set<FieldKey>([
  'name',
  'email',
  'phone',
  'address',
  'mainContact',
  'emergencyContact',
  'territory',
  'reportsTo',
]);

const getFieldsForRole = (role: UserEntityType) => {
  switch (role) {
    case 'manager':
      return ['fullName', 'managerId', 'address', 'phone', 'email', 'territory', 'role', 'reportsTo', 'startDate'];
    case 'contractor':
      return ['name', 'contractorId', 'address', 'phone', 'email', 'website', 'mainContact', 'startDate'];
    case 'customer':
      return ['name', 'customerId', 'address', 'phone', 'email', 'website', 'mainContact', 'startDate'];
    case 'center':
      return ['name', 'centerId', 'address', 'phone', 'email', 'website', 'mainContact', 'startDate'];
    case 'crew':
      return ['name', 'crewId', 'address', 'phone', 'email', 'emergencyContact', 'startDate'];
    case 'warehouse':
      return ['name', 'warehouseId', 'address', 'phone', 'email', 'mainContact', 'startDate'];
    default:
      return [];
  }
};

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export interface EditableUserProfileTabProps {
  entityType: UserEntityType;
  entityId: string;
  entityData: any;
  profileData: any;
}

export default function EditableUserProfileTab({
  entityType,
  entityId,
  entityData,
  profileData,
}: EditableUserProfileTabProps) {
  const { getToken } = useAuth();
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);

  const initialValues = useMemo(() => {
    return {
      name: normalizeValue(entityData?.name ?? entityData?.fullName ?? profileData?.fullName ?? profileData?.name),
      email: normalizeValue(entityData?.email),
      phone: normalizeValue(entityData?.phone),
      address: normalizeValue(entityData?.address),
      mainContact: normalizeValue(entityData?.mainContact),
      emergencyContact: normalizeValue(entityData?.emergencyContact),
      territory: normalizeValue(entityData?.territory ?? entityData?.metadata?.territory),
      reportsTo: normalizeValue(entityData?.reportsTo ?? entityData?.metadata?.reportsTo),
    };
  }, [entityData, profileData]);

  const [formValues, setFormValues] = useState<Record<FieldKey, string>>(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      if (detail.entityId && detail.entityId !== entityId) {
        return;
      }
      if (detail.mode === 'toggle') {
        setIsEditing((prev) => !prev);
        return;
      }
      if (typeof detail.enabled === 'boolean') {
        setIsEditing(detail.enabled);
        return;
      }
      setIsEditing(true);
    };

    window.addEventListener('cks:modal:profile-edit', handler as EventListener);
    return () => window.removeEventListener('cks:modal:profile-edit', handler as EventListener);
  }, [entityId]);

  useEffect(() => {
    if (!isEditing) {
      setFormValues(initialValues);
    }
  }, [isEditing, initialValues]);

  const fields = getFieldsForRole(entityType);

  const isDirty = Object.keys(formValues).some((key) => {
    const fieldKey = key as FieldKey;
    return formValues[fieldKey] !== initialValues[fieldKey];
  });

  const buildPayload = (): UserProfileUpdatePayload => {
    const payload: UserProfileUpdatePayload = {};
    (Object.keys(formValues) as FieldKey[]).forEach((fieldKey) => {
      if (formValues[fieldKey] !== initialValues[fieldKey]) {
        payload[fieldKey] = formValues[fieldKey].trim() || null;
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
      setIsEditing(false);
    } catch (error: any) {
      console.error('[EditableUserProfileTab] Update failed', error);
      toast.error(error?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const name = profileData?.name || profileData?.fullName;
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Not Set';
    }
    return String(value);
  };

  const isEditableField = (field: string) => {
    const mapped = FIELD_TO_INPUT_KEY[field];
    return mapped ? EDITABLE_FIELDS.has(mapped) : false;
  };

  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
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
          <span style={{ userSelect: 'none' }}>{getInitials()}</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <table style={{ width: '100%', borderSpacing: 0 }}>
          <tbody>
            {fields.map((field) => {
              const label = FIELD_LABELS[field] || field;
              const value = formatValue(profileData?.[field]);
              const isNotSet = value === 'Not Set';
              const editable = isEditableField(field);
              const inputKey = FIELD_TO_INPUT_KEY[field];

              if (field === 'website' && isNotSet) {
                return null;
              }

              return (
                <tr key={field} style={{ borderBottom: '1px solid #f3f4f6' }}>
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
                    {label}
                  </td>
                  <td style={{
                    fontSize: '16px',
                    color: isNotSet ? '#9ca3af' : '#111827',
                    padding: '16px 0',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    fontStyle: isNotSet ? 'italic' : 'normal'
                  }}>
                    {isEditing && editable && inputKey ? (
                      <input
                        value={formValues[inputKey]}
                        onChange={(event) =>
                          setFormValues((prev) => ({ ...prev, [inputKey]: event.target.value }))
                        }
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 14,
                          width: '100%',
                        }}
                      />
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
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
        )}
      </div>
    </div>
  );
}
