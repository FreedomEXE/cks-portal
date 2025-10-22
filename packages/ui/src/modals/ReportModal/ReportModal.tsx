import React, { useState } from 'react';
import BaseViewModal from '../BaseViewModal';
import ReportCard from '../../cards/ReportCard';
import ReportQuickActions, { type ReportAcknowledgment, type ReportResolution } from './components/ReportQuickActions';
import ReportDetails from './components/ReportDetails';

export interface Report {
  id: string;
  type: 'report' | 'feedback';
  reportReason?: string;
  status: 'open' | 'resolved' | 'closed';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  rating?: number | null;
  reportCategory?: string;
  submittedBy: string;
  submittedDate: string;
  relatedEntityId?: string;
  serviceManagedBy?: string;
  description?: string;
  acknowledgments?: ReportAcknowledgment[];
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: ReportResolution;
  resolution_notes?: string;
}

export interface ReportAction {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
}

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  currentUser?: string;
  showQuickActions?: boolean; // true from Activity Feed, false from Reports section
  actions?: ReportAction[]; // Action buttons (archive, delete, etc.)
  role?: 'user' | 'admin';
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  report,
  currentUser,
  showQuickActions = true, // Default to true (Activity Feed behavior)
  actions = [],
  role,
}) => {
  // Tab state - default tab depends on showQuickActions
  const [activeTab, setActiveTab] = useState(showQuickActions ? 'quick-actions' : 'details');

  // Build tabs based on showQuickActions prop
  const tabs = showQuickActions
    ? [
        { id: 'quick-actions', label: 'Quick Actions' },
        { id: 'details', label: 'Details' },
      ]
    : [{ id: 'details', label: 'Details' }];

  // Early return AFTER all hooks
  if (!isOpen || !report) return null;

  // ReportCard for header
  const card = (
    <ReportCard
      reportId={report.id}
      type={report.type}
      reportReason={report.reportReason}
      status={report.status}
      priority={report.priority || null}
      rating={report.rating || null}
      variant="embedded"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  return (
    <BaseViewModal isOpen={isOpen} onClose={onClose} card={card}>
      {activeTab === 'quick-actions' && showQuickActions && (
        <ReportQuickActions
          type={report.type}
          status={report.status}
          acknowledgments={report.acknowledgments}
          resolvedBy={report.resolvedBy}
          resolvedAt={report.resolvedAt}
          resolution={report.resolution}
          resolution_notes={report.resolution_notes}
          currentUser={currentUser}
          actions={actions}
        />
      )}

      {activeTab === 'details' && (
        <ReportDetails
          type={report.type}
          reportCategory={report.reportCategory}
          submittedBy={report.submittedBy}
          submittedDate={report.submittedDate}
          relatedEntityId={report.relatedEntityId}
          serviceManagedBy={report.serviceManagedBy}
          reportReason={report.reportReason}
          description={report.description}
        />
      )}
    </BaseViewModal>
  );
};

export default ReportModal;
