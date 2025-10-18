import React, { useState, useMemo } from 'react';
import styles from './ServiceQuickActions.module.css';

export interface CertifiedUser {
  code: string;
  name: string;
  isCertified: boolean;
}

export type UserRole = 'manager' | 'contractor' | 'crew' | 'warehouse';

export interface ServiceQuickActionsProps {
  managers?: CertifiedUser[];
  contractors?: CertifiedUser[];
  crew?: CertifiedUser[];
  warehouses?: CertifiedUser[];
  managedBy?: 'manager' | 'warehouse';
  category?: string;
  onCertificationChange?: (role: UserRole, userCode: string, certified: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ServiceQuickActions: React.FC<ServiceQuickActionsProps> = ({
  managers = [],
  contractors = [],
  crew = [],
  warehouses = [],
  managedBy = 'manager',
  category = '',
  onCertificationChange,
  onEdit,
  onDelete,
}) => {
  const [addUserType, setAddUserType] = useState<UserRole | 'all'>('all');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [certifiedUserType, setCertifiedUserType] = useState<UserRole | 'all'>('all');
  const [certifiedSearchQuery, setCertifiedSearchQuery] = useState('');

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

  // Combine all users into single list with role
  const allUsers = useMemo(() => {
    const users: Array<CertifiedUser & { role: UserRole }> = [];

    if (isWarehouseService) {
      warehouses.forEach(u => users.push({ ...u, role: 'warehouse' }));
    } else {
      managers.forEach(u => users.push({ ...u, role: 'manager' }));
      contractors.forEach(u => users.push({ ...u, role: 'contractor' }));
      crew.forEach(u => users.push({ ...u, role: 'crew' }));
    }

    return users;
  }, [managers, contractors, crew, warehouses, isWarehouseService]);

  // Filter users for "Add Certifications" section
  const filteredAddUsers = useMemo(() => {
    let filtered = allUsers;

    // Filter by user type
    if (addUserType !== 'all') {
      filtered = filtered.filter(u => u.role === addUserType);
    }

    // Filter by search query
    if (addSearchQuery.trim()) {
      const query = addSearchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.code.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query)
      );
    }

    // Sort: certified first
    return filtered.sort((a, b) => {
      if (a.isCertified === b.isCertified) return 0;
      return a.isCertified ? -1 : 1;
    });
  }, [allUsers, addUserType, addSearchQuery]);

  // Filter users for "Certified Users" section
  const filteredCertifiedUsers = useMemo(() => {
    let filtered = allUsers.filter(u => u.isCertified);

    // Filter by user type
    if (certifiedUserType !== 'all') {
      filtered = filtered.filter(u => u.role === certifiedUserType);
    }

    // Filter by search query
    if (certifiedSearchQuery.trim()) {
      const query = certifiedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.code.toLowerCase().includes(query) ||
          u.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allUsers, certifiedUserType, certifiedSearchQuery]);

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      manager: 'Manager',
      contractor: 'Contractor',
      crew: 'Crew',
      warehouse: 'Warehouse'
    };
    return labels[role];
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
                onClick={() =>
                  onCertificationChange?.(user.role, user.code, !user.isCertified)
                }
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

      {/* ACTIONS Section */}
      {(onEdit || onDelete) && (
        <div className={styles.actionsSection}>
          <h4 className={styles.sectionTitle}>ACTIONS</h4>
          <div className={styles.actions}>
            {onEdit && (
              <button className={`${styles.actionButton} ${styles.actionEdit}`} onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className={`${styles.actionButton} ${styles.actionDelete}`} onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceQuickActions;
