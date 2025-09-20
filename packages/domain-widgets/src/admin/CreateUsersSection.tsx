/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CreateUsersSection.tsx
 *
 * Description:
 * Admin section for creating new users of all role types.
 *
 * Responsibilities:
 * - Role selection and dynamic form rendering
 * - Auto-generation of user IDs and smart field population
 * - Form validation and submission to unassigned bucket
 * - Integration with existing profile data structures
 *
 * Role in system:
 * - Primary user creation interface for admin
 *
 * Notes:
 * - Maps to existing profile structures for each role
 * - Creates users in unassigned status initially
 * - Uses existing form patterns from reports/orders system
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import { User, UserRole, CreateUserForm, generateUserId } from './types';

interface CreateUsersSectionProps {
  existingUsers: User[];
  onUserCreated: (user: User) => void;
  adminId: string;
}

export default function CreateUsersSection({ existingUsers, onUserCreated, adminId }: CreateUsersSectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [formData, setFormData] = useState<CreateUserForm>({
    role: 'contractor',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    address: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    { value: 'manager', label: 'Manager - Create new CKS manager' },
    { value: 'contractor', label: 'Contractor - Create new contractor company' },
    { value: 'customer', label: 'Customer - Create new customer account' },
    { value: 'center', label: 'Center - Create new service center' },
    { value: 'crew', label: 'Crew - Create new crew member' },
    { value: 'warehouse', label: 'Warehouse - Create new warehouse facility' }
  ];

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setFormData(prev => ({ ...prev, role }));
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!selectedRole) return false;

    // Company name OR personal name required
    if (!formData.companyName && !formData.name) return false;

    // Email format validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) return false;

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Generate new user ID
    const newUserId = generateUserId(selectedRole as UserRole, existingUsers);
    const currentDate = new Date().toISOString().split('T')[0];

    // Create new user object
    const newUser: User = {
      id: newUserId,
      role: selectedRole as UserRole,
      status: 'active',
      assignmentStatus: 'unassigned',
      name: formData.name,
      companyName: formData.companyName,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      address: formData.address,
      createdDate: currentDate,
      startDate: currentDate, // Auto-populated same as created date
      lastUpdated: currentDate,
      createdBy: adminId,
      children: [],
      childrenRoles: []
    };

    // Simulate API call delay
    setTimeout(() => {
      onUserCreated(newUser);

      // Reset form
      setFormData({
        role: 'contractor',
        name: '',
        companyName: '',
        email: '',
        phone: '',
        website: '',
        address: ''
      });
      setSelectedRole('');
      setIsSubmitting(false);
    }, 500);
  };

  const getRoleDisplayName = (role: UserRole): string => {
    const displayNames = {
      manager: 'Manager',
      contractor: 'Contractor',
      customer: 'Customer',
      center: 'Center',
      crew: 'Crew',
      warehouse: 'Warehouse'
    };
    return displayNames[role];
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Create Users
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Create and provision all types of CKS Portal users
        </p>
      </div>

      {/* Role Selection */}
      <div style={{ marginBottom: 32 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 8
        }}>
          Select User Type
        </label>
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#111827',
            fontSize: '14px'
          }}
        >
          <option value="">Select a user type...</option>
          {roleOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic Form */}
      {selectedRole && (
        <div className="ui-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
            Create {getRoleDisplayName(selectedRole)}
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>
            Create new {selectedRole} {selectedRole === 'contractor' ? 'company' : selectedRole === 'customer' ? 'account' : selectedRole === 'center' ? 'service center' : selectedRole === 'warehouse' ? 'facility' : selectedRole === 'crew' ? 'member' : ''}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {/* Company Name - Primary for business entities */}
            {['contractor', 'customer', 'center', 'warehouse'].includes(selectedRole) && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 6
                }}>
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {/* Personal Name - Primary for individual roles */}
            {(['manager', 'crew'].includes(selectedRole) || formData.companyName) && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 6
                }}>
                  {['manager', 'crew'].includes(selectedRole) ? 'Name' : 'Main Contact'}
                </label>
                <input
                  type="text"
                  placeholder={['manager', 'crew'].includes(selectedRole) ? 'Enter full name' : 'Enter main contact name'}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {/* Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 6
              }}>
                Address
              </label>
              <input
                type="text"
                placeholder={`Enter ${selectedRole === 'contractor' || selectedRole === 'customer' ? 'company' : selectedRole} address`}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#111827',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 6
              }}>
                Phone
              </label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#111827',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#111827',
                marginBottom: 6
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  color: '#111827',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Website - Only for business entities */}
            {['contractor', 'customer', 'center', 'warehouse'].includes(selectedRole) && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#111827',
                  marginBottom: 6
                }}>
                  Website
                </label>
                <input
                  type="url"
                  placeholder="Enter website URL"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!validateForm() || isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: validateForm() && !isSubmitting ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: validateForm() && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            {isSubmitting ? 'Creating...' : `Create ${getRoleDisplayName(selectedRole)}`}
          </button>
        </div>
      )}
    </div>
  );
}