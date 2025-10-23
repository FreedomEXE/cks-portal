import React, { ReactNode } from 'react';
import Button from '../../buttons/Button';
import ApprovalWorkflow from '../../workflows/ApprovalWorkflow';
import styles from './ActivityModal.module.css';

export type ActivityActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export interface ActivityAction {
  label: string;
  onClick: () => void;
  variant?: ActivityActionVariant;
  disabled?: boolean;
}

export interface OrderActionsContentProps {
  actions: ActivityAction[];
  approvalStages?: Array<{
    role: string;
    status: string;
    user?: string | null;
    timestamp?: string | null;
  }>;
  children?: ReactNode; // For complex workflow content
}

/**
 * OrderActionsContent - Pure content component for order actions tab
 *
 * Extracted from ActivityModal to support universal tab composition.
 * No tab management logic - just renders approval workflow and action buttons.
 */
export default function OrderActionsContent({
  actions,
  approvalStages,
  children,
}: OrderActionsContentProps) {
  return (
    <div className={styles.actionsTab}>
      {/* Approval Workflow */}
      <ApprovalWorkflow stages={approvalStages} />

      {/* Actions Section */}
      <div className={styles.actionsSection}>
        <h4 className={styles.actionsTitle}>Actions</h4>
        <div className={styles.actionsGrid}>
          {actions.map((a, idx) => (
            <Button
              key={idx}
              variant={(a.variant || 'secondary') as any}
              className={styles.bigButton}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Optional custom workflow content */}
      {children}
    </div>
  );
}
