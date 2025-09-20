/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: AssignUsersSection.tsx
 *
 * Description:
 * Smart Assignment System for managing user hierarchy assignments.
 *
 * Responsibilities:
 * - Display unassigned users filtered by role type
 * - Enforce smart assignment rules (Contractor→Manager, etc.)
 * - Handle assignment operations with real-time updates
 * - Update both user assignment status and directory
 *
 * Role in system:
 * - Primary assignment interface for admin user management
 *
 * Notes:
 * - Follows smart rules from screenshots
 * - Updates Directory component in real-time
 * - Prevents invalid assignments based on role hierarchy
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import { User, UserRole, ASSIGNMENT_RULES, canAssignRole, getValidParentRoles, AssignmentOperation } from './types';

interface AssignUsersSectionProps {
  users: User[];
  onAssignmentCompleted: (assignment: AssignmentOperation) => void;
  adminId: string;
}

export default function AssignUsersSection({ users, onAssignmentCompleted, adminId }: AssignUsersSectionProps) {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole>('contractor');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Get unassigned users for selected role
  const unassignedUsers = users.filter(user =>
    user.role === selectedRoleFilter && user.assignmentStatus === 'unassigned'
  );

  // Get valid target users for assignment
  const validParentRoles = getValidParentRoles(selectedRoleFilter);
  const availableTargets = users.filter(user =>
    validParentRoles.includes(user.role) && user.status === 'active'
  );

  const roleFilterOptions = [
    { value: 'contractor', label: 'Unassigned - Contractors', count: users.filter(u => u.role === 'contractor' && u.assignmentStatus === 'unassigned').length },
    { value: 'customer', label: 'Unassigned - Customers', count: users.filter(u => u.role === 'customer' && u.assignmentStatus === 'unassigned').length },
    { value: 'center', label: 'Unassigned - Centers', count: users.filter(u => u.role === 'center' && u.assignmentStatus === 'unassigned').length },
    { value: 'crew', label: 'Unassigned - Crew', count: users.filter(u => u.role === 'crew' && u.assignmentStatus === 'unassigned').length },
    { value: 'warehouse', label: 'Unassigned - Warehouses', count: users.filter(u => u.role === 'warehouse' && u.assignmentStatus === 'unassigned').length }
  ];

  const handleUserSelection = (userId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === unassignedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(unassignedUsers.map(user => user.id));
    }
  };

  const handleAssignment = () => {
    if (selectedUsers.length === 0 || !selectedTargetUser) return;

    setIsAssigning(true);

    const targetUser = users.find(u => u.id === selectedTargetUser);
    if (!targetUser) return;

    // Validate assignment is allowed
    if (!canAssignRole(selectedRoleFilter, targetUser.role)) {
      alert(`Cannot assign ${selectedRoleFilter} to ${targetUser.role}`);
      setIsAssigning(false);
      return;
    }

    // Create assignment operation
    const assignment: AssignmentOperation = {
      userId: selectedUsers[0], // For demo, assign first selected user
      targetUserId: selectedTargetUser,
      targetRole: targetUser.role,
      timestamp: new Date().toISOString(),
      performedBy: adminId
    };

    // Simulate API call
    setTimeout(() => {
      onAssignmentCompleted(assignment);
      setSelectedUsers([]);
      setSelectedTargetUser('');
      setIsAssigning(false);
    }, 1000);
  };

  const getTargetRoleDescription = (parentRole: UserRole): string => {
    const descriptions = {
      manager: 'CKS Managers',
      contractor: 'Contractors',
      customer: 'Customers',
      center: 'Centers',
      crew: 'Crew Members',
      warehouse: 'Warehouses'
    };
    return descriptions[parentRole];
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Smart Assignment System
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Select users from unassigned pools and assign them to appropriate roles
        </p>

        {/* Smart Rules Display */}
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Smart Rules:
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {ASSIGNMENT_RULES.map((rule, index) => (
              <span
                key={index}
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  backgroundColor: 'white',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #e5e7eb'
                }}
              >
                {rule.description}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Role Filter Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 8
        }}>
          Select Unassigned User Type
        </label>
        <select
          value={selectedRoleFilter}
          onChange={(e) => {
            setSelectedRoleFilter(e.target.value as UserRole);
            setSelectedUsers([]);
            setSelectedTargetUser('');
          }}
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
          {roleFilterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.count})
            </option>
          ))}
        </select>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          Select a user type to view and assign unassigned users from that category.
        </p>
      </div>

      {/* Unassigned Users List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {roleFilterOptions.find(opt => opt.value === selectedRoleFilter)?.label} ({unassignedUsers.length})
            </h2>
            {unassignedUsers.length > 0 && (
              <button
                onClick={handleSelectAll}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {selectedUsers.length === unassignedUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0 0' }}>
            Select users to assign to appropriate roles
          </p>
        </div>

        {unassignedUsers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              No unassigned {selectedRoleFilter}s found
            </h3>
            <p style={{ fontSize: 14, margin: 0 }}>
              All {selectedRoleFilter}s have been assigned to appropriate roles or there are no pending assignments.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff' }}>
            {unassignedUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: 16,
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: selectedUsers.includes(user.id) ? '#f0f9ff' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {user.id}
                    </span>
                    <span style={{
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {user.companyName || user.name || 'Unnamed'}
                    </span>
                    <span style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}>
                      Unassigned
                    </span>
                  </div>
                  {user.email && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Section */}
      {selectedUsers.length > 0 && (
        <div className="ui-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            Assign Selected {selectedRoleFilter.charAt(0).toUpperCase() + selectedRoleFilter.slice(1)}
            {selectedUsers.length > 1 ? 's' : ''} ({selectedUsers.length})
          </h3>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#111827',
              marginBottom: 8
            }}>
              Assign to {getTargetRoleDescription(validParentRoles[0])}
            </label>
            <select
              value={selectedTargetUser}
              onChange={(e) => setSelectedTargetUser(e.target.value)}
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
              <option value="">Select a {validParentRoles[0]}...</option>
              {availableTargets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.id} - {target.companyName || target.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssignment}
            disabled={!selectedTargetUser || isAssigning}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: selectedTargetUser && !isAssigning ? '#10b981' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: selectedTargetUser && !isAssigning ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            {isAssigning ? 'Assigning...' : `Assign ${selectedUsers.length} ${selectedRoleFilter}${selectedUsers.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}