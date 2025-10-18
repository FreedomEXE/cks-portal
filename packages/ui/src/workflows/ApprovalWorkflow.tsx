import React from 'react';
import styles from './ApprovalWorkflow.module.css';

export interface ApprovalStage {
  role: string;
  status: string;
  user?: string | null;
  timestamp?: string | null;
  label?: string;
}

export interface ApprovalWorkflowProps {
  stages?: ApprovalStage[];
  variant?: 'default' | 'compact';
}

/**
 * ApprovalWorkflow - Reusable workflow display component
 *
 * Displays approval stages with color-coded status boxes.
 * Used in OrderCard expanded view and ActivityModal Quick Actions.
 */
export function ApprovalWorkflow({ stages = [], variant = 'default' }: ApprovalWorkflowProps) {
  if (!stages || stages.length === 0) return null;

  const getStageColorClass = (status: string): string => {
    const normalized = status.toLowerCase();

    switch (normalized) {
      case 'approved':
      case 'delivered':
      case 'completed':
      case 'service-created':
      case 'crew-assigned':
      case 'requested':
        return styles.stageGreen;
      case 'pending':
      case 'waiting':
      case 'accepted':
      case 'crew-requested':
      case 'manager-accepted':
        return styles.stageYellow;
      case 'rejected':
      case 'cancelled':
        return styles.stageRed;
      case 'in-progress':
        return styles.stageBlue;
      default:
        return styles.stageGray;
    }
  };

  // Find first pending stage for pulsing animation
  const firstPendingIndex = stages.findIndex(s => s.status.toLowerCase() === 'pending');

  return (
    <div className={styles.workflowContainer}>
      <h4 className={styles.workflowTitle}>Approval Workflow</h4>
      <div className={styles.workflowStages}>
        {stages.map((stage, index) => {
          // Pulse the first pending stage OR any accepted stage that's the last stage
          const shouldPulse = (index === firstPendingIndex) ||
                             (stage.status.toLowerCase() === 'accepted' && index === stages.length - 1);

          return (
            <div key={index} className={styles.stageContainer}>
              <div
                className={`${styles.stage} ${getStageColorClass(stage.status)} ${shouldPulse ? styles.pulsingStage : ''}`}
              >
                <div className={styles.stageRole}>{stage.role}</div>
                <div className={styles.stageStatus}>
                  {stage.label || stage.status.replace('-', ' ').replace('_', ' ')}
                </div>
                {stage.user && (
                  <div className={styles.stageUser}>{stage.user}</div>
                )}
              </div>
              {index < stages.length - 1 && (
                <div className={styles.stageArrow}>→</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ApprovalWorkflow;
