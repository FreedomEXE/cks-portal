import React, { useState, useMemo, useEffect } from 'react';
import styles from './ServiceQuickActions.module.css';

export interface CertifiedUser {
  code: string;
  name: string;
  isCertified: boolean;
}

export type UserRole = 'manager' | 'contractor' | 'crew' | 'warehouse';

export interface CertificationChanges {
  manager: string[];
  contractor: string[];
  crew: string[];
  warehouse: string[];
}

export interface ServiceQuickActionsProps {
  managers?: CertifiedUser[];
  contractors?: CertifiedUser[];
  crew?: CertifiedUser[];
  warehouses?: CertifiedUser[];
  managedBy?: 'manager' | 'warehouse';
  category?: string;
  onSave?: (changes: CertificationChanges) => Promise<void>;
  onEdit?: () => void;  // Legacy prop for old CatalogServiceModal (unused in universal modal)
  onDelete?: () => void;  // Legacy prop for old CatalogServiceModal (unused in universal modal)
  adminActions?: Array<{
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
  }>;
}

const ServiceQuickActions: React.FC<ServiceQuickActionsProps> = ({
  managers = [],
  contractors = [],
  crew = [],
  warehouses = [],
  managedBy = 'manager',
  category = '',
  onSave,
  adminActions = [],
}) => {
  const [addUserType, setAddUserType] = useState<UserRole | 'all'>('all');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [certifiedUserType, setCertifiedUserType] = useState<UserRole | 'all'>('all');
  const [certifiedSearchQuery, setCertifiedSearchQuery] = useState('');

  // Track pending certification changes
  const [pendingCertifications, setPendingCertifications] = useState<{
    manager: Set<string>;
    contractor: Set<string>;
    crew: Set<string>;
    warehouse: Set<string>;
  }>({
    manager: new Set(managers.filter(m => m.isCertified).map(m => m.code)),
    contractor: new Set(contractors.filter(c => c.isCertified).map(c => c.code)),
    crew: new Set(crew.filter(c => c.isCertified).map(c => c.code)),
    warehouse: new Set(warehouses.filter(w => w.isCertified).map(w => w.code)),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update pending certifications when props change (e.g., modal reopens)
  useEffect(() => {
    setPendingCertifications({
      manager: new Set(managers.filter(m => m.isCertified).map(m => m.code)),
      contractor: new Set(contractors.filter(c => c.isCertified).map(c => c.code)),
      crew: new Set(crew.filter(c => c.isCertified).map(c => c.code)),
      warehouse: new Set(warehouses.filter(w => w.isCertified).map(w => w.code)),
    });
    setHasChanges(false);
  }, [managers, contractors, crew, warehouses]);

  // Determine if this is a warehouse service based on category
  const isWarehouseService = category.toLowerCase() === 'warehouse';

  // Determine available user types based on service category
  const availableUserTypes = useMemo(() => {
    if (isWarehouseService) {
      return [
        { value: 'warehouse' as const, label: 'Warehouses' }
      ];
    } else {
      return [
        { value: 'manager' as const, label: 'Managers' },
        { value: 'contractor' as const, label: 'Contractors' },
        { value: 'crew' as const, label: 'Crew' }
      ];
    }
  }, [isWarehouseService]);

  // Combine all users into single list with role and use pending certifications
  const allUsers = useMemo(() => {
    const users: Array<CertifiedUser & { role: UserRole }> = [];

    if (isWarehouseService) {
      warehouses.forEach(u => users.push({
        ...u,
        role: 'warehouse',
        isCertified: pendingCertifications.warehouse.has(u.code)
      }));
    } else {
      managers.forEach(u => users.push({
        ...u,
        role: 'manager',
        isCertified: pendingCertifications.manager.has(u.code)
      }));
      contractors.forEach(u => users.push({
        ...u,
        role: 'contractor',
        isCertified: pendingCertifications.contractor.has(u.code)
      }));
      crew.forEach(u => users.push({
        ...u,
        role: 'crew',
        isCertified: pendingCertifications.crew.has(u.code)
      }));
    }

    return users;
  }, [managers, contractors, crew, warehouses, isWarehouseService, pendingCertifications]);

  // Toggle certification status
  const toggleCertification = (role: UserRole, userCode: string) => {
    setPendingCertifications(prev => {
      const newCerts = { ...prev };
      const roleSet = new Set(newCerts[role]);

      if (roleSet.has(userCode)) {
        roleSet.delete(userCode);
      } else {
        roleSet.add(userCode);
      }

      newCerts[role] = roleSet;
      return newCerts;
    });
    setHasChanges(true);
  };

  // Handle Save button
  const handleSave = async () => {
    if (!onSave || !hasChanges) return;

    setIsSaving(true);
    try {
      await onSave({
        manager: Array.from(pendingCertifications.manager),
        contractor: Array.from(pendingCertifications.contractor),
        crew: Array.from(pendingCertifications.crew),
        warehouse: Array.from(pendingCertifications.warehouse),
      });
      setHasChanges(false);
    } catch (error) {
      console.error('[ServiceQuickActions] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter users for "Add Certifications" section
  const filteredAddUsers = useMemo(() => {
    let filtered = allUsers;

    if (addUserType !== 'all') {
      filtered = filtered.filter(u => u.role === addUserType);
    }

    if (addSearchQuery) {
      const query = addSearchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allUsers, addUserType, addSearchQuery]);

  // Filter users for "Certified Users" section (only show certified)
  const filteredCertifiedUsers = useMemo(() => {
    let filtered = allUsers.filter(u => u.isCertified);

    if (certifiedUserType !== 'all') {
      filtered = filtered.filter(u => u.role === certifiedUserType);
    }

    if (certifiedSearchQuery) {
      const query = certifiedSearchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.code.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allUsers, certifiedUserType, certifiedSearchQuery]);

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'contractor': return 'Contractor';
      case 'crew': return 'Crew';
      case 'warehouse': return 'Warehouse';
      default: return role;
    }
  };

  return (
    <div>
      {/* ADD CERTIFICATIONS Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>ADD CERTIFICATIONS</h4>

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={addUserType}
            onChange={(e) => setAddUserType(e.target.value as UserRole | 'all')}
          >
            <option value="all">All Types</option>
            {availableUserTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search users..."
            value={addSearchQuery}
            onChange={(e) => setAddSearchQuery(e.target.value)}
            className={styles.filterSearch}
          />
        </div>

        {/* User List */}
        <div className={styles.scrollableList}>
          {filteredAddUsers.map((user) => (
            <div
              key={`${user.role}-${user.code}`}
              className={`${styles.userItem} ${user.isCertified ? styles.certifiedUser : ''}`}
            >
              <div className={styles.userInfo}>
                {user.isCertified && <span className={styles.checkmark}>✓</span>}
                <div>
                  <span className={styles.userName}>{user.name}</span>
                  <span className={styles.userMeta}>
                    {user.code} • {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
              <button
                className={`${styles.certButton} ${
                  user.isCertified ? styles.removeButton : styles.addButton
                }`}
                onClick={() => toggleCertification(user.role, user.code)}
              >
                {user.isCertified ? 'Remove' : '+ Certify'}
              </button>
            </div>
          ))}

          {filteredAddUsers.length === 0 && (
            <div className={styles.emptyState}>
              No users found{addSearchQuery ? ' matching your search' : ''}
            </div>
          )}
        </div>
      </div>

      {/* CERTIFIED USERS Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>
          CERTIFIED USERS ({filteredCertifiedUsers.length})
        </h4>

        {/* Filters */}
        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={certifiedUserType}
            onChange={(e) => setCertifiedUserType(e.target.value as UserRole | 'all')}
          >
            <option value="all">All Types</option>
            {availableUserTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search certified users..."
            value={certifiedSearchQuery}
            onChange={(e) => setCertifiedSearchQuery(e.target.value)}
            className={styles.filterSearch}
          />
        </div>

        {/* Certified User List */}
        <div className={styles.scrollableList}>
          {filteredCertifiedUsers.map((user) => (
            <div key={`${user.role}-${user.code}`} className={styles.viewOnlyItem}>
              <span className={styles.checkmark}>✓</span>
              <div>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userMeta}>
                  {user.code} • {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          ))}

          {filteredCertifiedUsers.length === 0 && (
            <div className={styles.emptyState}>
              No certified users{certifiedSearchQuery ? ' matching your search' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS Section - Admin actions on left, Save on right */}
      {(onSave || (adminActions && adminActions.length > 0)) ? (
        <div className={styles.actionsSection}>
          <h4 className={styles.sectionTitle}>ACTIONS</h4>
          <div className={styles.actions}>
            <div className={styles.leftActions}>
              {adminActions.map((a, i) => {
                const cls = a.variant === 'danger'
                  ? `${styles.actionButton} ${styles.actionDelete}`
                  : a.variant === 'primary'
                    ? `${styles.actionButton} ${styles.actionSave}`
                    : `${styles.actionButton} ${styles.actionEdit}`;
                return (
                  <button key={i} className={cls} onClick={() => a.onClick()} disabled={a.disabled}>
                    {a.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.rightActions}>
              {onSave && (
                <button
                  className={`${styles.actionButton} ${styles.actionSave}`}
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ServiceQuickActions;
