import React from 'react';
import styles from './UserModal.module.css';
import type { UserAction } from '../../cards/UserCard';

export interface UserQuickActionsProps {
  actions: UserAction[];
}

const UserQuickActions: React.FC<UserQuickActionsProps> = ({ actions }) => {
  if (actions.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
        No actions available
      </div>
    );
  }

  const getActionButtonClass = (action: UserAction) => {
    const variant = action.variant || 'secondary';
    if (variant === 'primary') {
      return `${styles.actionButton} ${styles.actionApprove}`;
    }
    if (variant === 'danger') {
      return `${styles.actionButton} ${styles.actionReject}`;
    }
    return `${styles.actionButton} ${styles.actionDefault}`;
  };

  return (
    <div className={styles.actionsSection}>
      <h4 className={styles.sectionTitle}>Actions</h4>
      <div className={styles.actions}>
        {actions.map((action, index) => (
          <button
            key={index}
            className={getActionButtonClass(action)}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserQuickActions;
