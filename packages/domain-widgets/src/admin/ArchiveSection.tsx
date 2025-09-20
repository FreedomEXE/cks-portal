/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ArchiveSection.tsx
 *
 * Description:
 * Archive Management system for viewing and managing soft-deleted items.
 *
 * Responsibilities:
 * - Display archived items filtered by type (Users, Services, Products, etc.)
 * - Provide restore functionality for archived items
 * - Handle permanent deletion with confirmation
 * - Track archive metadata and restoration capabilities
 *
 * Role in system:
 * - Secondary safety system for data recovery and permanent cleanup
 *
 * Notes:
 * - All deletions go to archive first (soft delete)
 * - Admin can restore or permanently delete from archive
 * - Follows established component patterns from orders/reports
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState } from 'react';
import { ArchivedItem, ArchiveType } from './types';

interface ArchiveSectionProps {
  archivedItems: ArchivedItem[];
  onRestoreItem: (itemId: string) => void;
  onPermanentDelete: (itemId: string) => void;
  adminId: string;
}

export default function ArchiveSection({ archivedItems, onRestoreItem, onPermanentDelete, adminId }: ArchiveSectionProps) {
  const [selectedArchiveType, setSelectedArchiveType] = useState<ArchiveType>('users');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const archiveTypeOptions = [
    { value: 'users', label: 'Archived Users', icon: '👥' },
    { value: 'services', label: 'Archived Services', icon: '🔧' },
    { value: 'products', label: 'Archived Products', icon: '📦' },
    { value: 'orders', label: 'Archived Orders', icon: '📋' },
    { value: 'reports', label: 'Archived Reports', icon: '📊' }
  ];

  // Filter archived items by type and search term
  const filteredItems = archivedItems.filter(item => {
    const matchesType = item.type === selectedArchiveType.slice(0, -1); // Remove 's' from plural
    const matchesSearch = searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originalId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRestore = (itemId: string) => {
    onRestoreItem(itemId);
  };

  const handlePermanentDelete = (itemId: string) => {
    if (confirmingDelete === itemId) {
      onPermanentDelete(itemId);
      setConfirmingDelete(null);
    } else {
      setConfirmingDelete(itemId);
      // Auto-cancel confirmation after 5 seconds
      setTimeout(() => {
        setConfirmingDelete(null);
      }, 5000);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string): string => {
    const icons = {
      user: '👤',
      service: '🔧',
      product: '📦',
      order: '📋',
      report: '📊'
    };
    return icons[type as keyof typeof icons] || '📄';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Archive Management
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          View and manage archived data, users, and system records
        </p>

        {/* Important Notice */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>
              Important Notice
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#92400e', margin: 0, lineHeight: 1.4 }}>
            Archived items can be restored or permanently deleted. Permanent deletion cannot be undone.
            Items are automatically archived when deleted from the main system.
          </p>
        </div>
      </div>

      {/* Archive Type Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: 'block',
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
          marginBottom: 8
        }}>
          Archive Type
        </label>
        <select
          value={selectedArchiveType}
          onChange={(e) => {
            setSelectedArchiveType(e.target.value as ArchiveType);
            setSearchTerm('');
            setConfirmingDelete(null);
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
          {archiveTypeOptions.map(option => {
            const count = archivedItems.filter(item => item.type === option.value.slice(0, -1)).length;
            return (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder={`Search archived ${selectedArchiveType}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            color: '#111827',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Archived Items List */}
      <div className="ui-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', margin: 0 }}>
            {archiveTypeOptions.find(opt => opt.value === selectedArchiveType)?.label} ({filteredItems.length})
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0 0' }}>
            {filteredItems.length === 0 ?
              'No archived items found' :
              'Archived items will appear here when available.'
            }
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', backgroundColor: '#ffffff' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              No archived {selectedArchiveType.toLowerCase()} found
            </h3>
            <p style={{ fontSize: 14, margin: 0 }}>
              {searchTerm ?
                `No archived items match "${searchTerm}"` :
                `No ${selectedArchiveType.toLowerCase()} have been archived yet.`
              }
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#ffffff' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: 16,
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16
                }}
              >
                {/* Item Icon */}
                <div style={{ fontSize: 20 }}>
                  {getTypeIcon(item.type)}
                </div>

                {/* Item Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {item.originalId}
                    </span>
                    <span style={{
                      color: '#111827',
                      fontSize: 14
                    }}>
                      {item.name}
                    </span>
                    {item.role && (
                      <span style={{
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {item.role}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                    <span>Archived: {formatDate(item.archivedDate)}</span>
                    <span>By: {item.archivedBy}</span>
                    {item.reason && <span>Reason: {item.reason}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Restore Button */}
                  {item.canRestore && (
                    <button
                      onClick={() => handleRestore(item.id)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                    >
                      Restore
                    </button>
                  )}

                  {/* Permanent Delete Button */}
                  <button
                    onClick={() => handlePermanentDelete(item.id)}
                    style={{
                      backgroundColor: confirmingDelete === item.id ? '#dc2626' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {confirmingDelete === item.id ? 'Confirm Delete' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Notice */}
      {confirmingDelete && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: 8,
          padding: 16,
          maxWidth: 300,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
              Confirm Permanent Delete
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>
            Click "Confirm Delete" again to permanently remove this item. This cannot be undone.
          </p>
        </div>
      )}
    </div>
  );
}