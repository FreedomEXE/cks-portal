/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: ProfileTab.tsx
 *
 * Description:
 * Profile tab content component for ProfileInfoCard
 *
 * Responsibilities:
 * - Display role-specific profile fields
 * - Show photo placeholder with update button
 * - Render profile data in list format
 *
 * Role in system:
 * - Profile information display within ProfileInfoCard
 *
 * Notes:
 * Field mappings vary by role
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React from 'react';
import { Button } from '@cks/ui';

export interface ProfileTabProps {
  role: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  profileData: any;
  primaryColor: string;
  photoUrl?: string | null;
}

export function ProfileTab({ role, profileData, primaryColor, photoUrl }: ProfileTabProps) {
  const normalizedPhotoUrl = typeof photoUrl === 'string' ? photoUrl.trim() : '';

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
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
      emergencyContact: 'Emergency Contact'
    };
    return labels[field] || field;
  };

  const getFieldsForRole = () => {
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
        // Territory not collected for crew; remove from display
        return ['name', 'crewId', 'address', 'phone', 'email', 'emergencyContact', 'startDate'];
      case 'warehouse':
        // Territory not collected for warehouses; remove from display
        return ['name', 'warehouseId', 'address', 'phone', 'email', 'mainContact', 'startDate'];
      default:
        return [];
    }
  };

  const fields = getFieldsForRole();

  // Fields that should be hidden entirely if empty
  const hideIfEmpty = new Set<string>(['website']);

  const getInitials = () => {
    const name = profileData.name || profileData.fullName;
    if (!name) return 'NA';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return 'Not Set';
    }
    return String(value);
  };

  return (
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
      {/* Photo Section - Left Side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: normalizedPhotoUrl ? '#f3f4f6' : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
          overflow: 'hidden',
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
          {normalizedPhotoUrl ? (
            <img
              src={normalizedPhotoUrl}
              alt="Profile"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span style={{ userSelect: 'none' }}>{getInitials()}</span>
          )}
        </div>
        {/* Photo upload available in Settings > Profile Photo */}
      </div>

      {/* Profile Info Grid - Right Side */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <table style={{ width: '100%', borderSpacing: 0 }}>
          <tbody>
            {fields.map((field) => {
              const value = formatFieldValue(profileData[field]);
              const isNotSet = value === 'Not Set';

              // Hide selected fields (e.g., website) when not set
              if (isNotSet && hideIfEmpty.has(field)) {
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
                    {getFieldLabel(field)}
                  </td>
                  <td style={{
                    fontSize: '16px',
                    color: isNotSet ? '#9ca3af' : '#111827',
                    padding: '16px 0',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    fontStyle: isNotSet ? 'italic' : 'normal'
                  }}>
                    {value}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfileTab;
