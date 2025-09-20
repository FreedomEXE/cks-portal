/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: AdminUsersSection.tsx
 *
 * Description:
 * Main admin users management section with tabbed interface for Create, Assign, Archive.
 *
 * Responsibilities:
 * - Coordinate between Create, Assign, Archive subsections
 * - Manage overall user state and updates
 * - Handle data flow between sections and directory updates
 * - Provide unified admin interface for user management
 *
 * Role in system:
 * - Primary admin interface matching the screenshots
 *
 * Notes:
 * - Follows established tab pattern from orders/reports
 * - Integrates with Directory component for real-time updates
 * - Manages mock data and state transitions
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import CreateUsersSection from './CreateUsersSection';
import AssignUsersSection from './AssignUsersSection';
import ArchiveSection from './ArchiveSection';
import { User, ArchivedItem, AssignmentOperation } from './types';

interface AdminUsersSectionProps {
  onDirectoryUpdate?: (users: User[]) => void;
  adminId?: string;
}

export default function AdminUsersSection({ onDirectoryUpdate, adminId = 'ADMIN-001' }: AdminUsersSectionProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'assign' | 'archive'>('create');

  // State management for users and archived items
  const [users, setUsers] = useState<User[]>([
    // Initial mock manager
    {
      id: 'MNG-001',
      role: 'manager',
      status: 'active',
      assignmentStatus: 'assigned',
      name: 'John Manager',
      email: 'john@cks.com',
      phone: '555-0100',
      createdDate: '2025-09-19',
      startDate: '2025-09-19',
      lastUpdated: '2025-09-19',
      createdBy: adminId,
      children: [],
      childrenRoles: []
    }
  ]);

  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);

  const tabs = [
    { id: 'create', label: 'Create Users', color: '#10b981', icon: '➕' },
    { id: 'assign', label: 'Assign Users', color: '#3b82f6', icon: '🔗' },
    { id: 'archive', label: 'Archive Management', color: '#6b7280', icon: '📦' }
  ];

  // Handle new user creation
  const handleUserCreated = (newUser: User) => {
    setUsers(prev => {
      const updated = [...prev, newUser];
      onDirectoryUpdate?.(updated);
      return updated;
    });

    // Optionally switch to assign tab after creation
    // setActiveTab('assign');
  };

  // Handle user assignment
  const handleAssignmentCompleted = (assignment: AssignmentOperation) => {
    setUsers(prev => {
      const updated = prev.map(user => {
        if (user.id === assignment.userId) {
          // Update assigned user
          return {
            ...user,
            assignmentStatus: 'assigned' as const,
            assignedTo: assignment.targetUserId,
            assignedToRole: assignment.targetRole,
            lastUpdated: assignment.timestamp.split('T')[0]
          };
        }
        if (user.id === assignment.targetUserId) {
          // Update parent user's children
          return {
            ...user,
            children: [...(user.children || []), assignment.userId],
            childrenRoles: [...(user.childrenRoles || []), prev.find(u => u.id === assignment.userId)?.role!],
            lastUpdated: assignment.timestamp.split('T')[0]
          };
        }
        return user;
      });
      onDirectoryUpdate?.(updated);
      return updated;
    });
  };

  // Handle item restoration from archive
  const handleRestoreItem = (itemId: string) => {
    const archivedItem = archivedItems.find(item => item.id === itemId);
    if (archivedItem && archivedItem.type === 'user') {
      // Restore user
      const restoredUser = archivedItem.originalData as User;
      setUsers(prev => {
        const updated = [...prev, { ...restoredUser, status: 'active' as const }];
        onDirectoryUpdate?.(updated);
        return updated;
      });

      // Remove from archive
      setArchivedItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Handle permanent deletion from archive
  const handlePermanentDelete = (itemId: string) => {
    setArchivedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Handle user archiving (soft delete)
  const handleUserArchived = (user: User) => {
    // Remove from active users
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== user.id);
      onDirectoryUpdate?.(updated);
      return updated;
    });

    // Add to archive
    const archivedItem: ArchivedItem = {
      id: `ARC-${user.id}`,
      originalId: user.id,
      type: 'user',
      name: user.companyName || user.name || 'Unnamed User',
      role: user.role,
      archivedDate: new Date().toISOString().split('T')[0],
      archivedBy: adminId,
      reason: 'Manual deletion',
      canRestore: true,
      originalData: user
    };

    setArchivedItems(prev => [...prev, archivedItem]);
  };

  // Get counts for tab badges
  const getUnassignedCount = () => {
    return users.filter(user => user.assignmentStatus === 'unassigned').length;
  };

  const getArchivedCount = () => {
    return archivedItems.filter(item => item.type === 'user').length;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          User Management
        </h1>
        <p style={{ color: '#6b7280' }}>
          Create, assign, and manage all CKS Portal users across the organization
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto', padding: '8px 0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              backgroundColor: activeTab === tab.id ? tab.color : '#f3f4f6',
              color: activeTab === tab.id ? 'white' : '#374151',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              position: 'relative'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {/* Badge for counts */}
            {tab.id === 'assign' && getUnassignedCount() > 0 && (
              <span style={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#ef4444',
                color: activeTab === tab.id ? 'white' : 'white',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700,
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {getUnassignedCount()}
              </span>
            )}
            {tab.id === 'archive' && getArchivedCount() > 0 && (
              <span style={{
                backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#6b7280',
                color: 'white',
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 700,
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {getArchivedCount()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'create' && (
          <CreateUsersSection
            existingUsers={users}
            onUserCreated={handleUserCreated}
            adminId={adminId}
          />
        )}

        {activeTab === 'assign' && (
          <AssignUsersSection
            users={users}
            onAssignmentCompleted={handleAssignmentCompleted}
            adminId={adminId}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveSection
            archivedItems={archivedItems}
            onRestoreItem={handleRestoreItem}
            onPermanentDelete={handlePermanentDelete}
            adminId={adminId}
          />
        )}
      </div>

      {/* Stats Summary */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        fontSize: 12,
        color: '#6b7280'
      }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Quick Stats</div>
        <div>Active Users: {users.filter(u => u.status === 'active').length}</div>
        <div>Unassigned: {getUnassignedCount()}</div>
        <div>Archived: {getArchivedCount()}</div>
      </div>
    </div>
  );
}