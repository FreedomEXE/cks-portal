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
  onUpdatePhoto?: () => void;
}

export function ProfileTab({ role, profileData, primaryColor, onUpdatePhoto }: ProfileTabProps) {
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
        return ['name', 'crewId', 'address', 'phone', 'email', 'territory', 'emergencyContact', 'startDate'];
      case 'warehouse':
        return ['name', 'warehouseId', 'address', 'phone', 'email', 'territory', 'mainContact', 'startDate'];
      default:
        return [];
    }
  };

  const fields = getFieldsForRole();

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {/* Photo Section - Left Side */}
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
          {profileData.name ? profileData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
           profileData.fullName ? profileData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'NA'}
        </div>
        <Button
          variant="secondary"
          onClick={onUpdatePhoto}
        >
          Update Photo
        </Button>
      </div>

      {/* Profile Info Grid - Right Side */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderSpacing: '0 16px' }}>
          <tbody>
            {fields.map((field) => (
              <tr key={field}>
                <td style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: 500,
                  width: '200px',
                  verticalAlign: 'top'
                }}>
                  {getFieldLabel(field)}
                </td>
                <td style={{
                  fontSize: 16,
                  color: '#111827'
                }}>
                  {profileData[field] || 'Not Set'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfileTab;
