import React from 'react';
import Button from '../../buttons/Button';

interface Entity {
  name?: string;
  companyName?: string;
  fullName?: string;
  code?: string;
  [key: string]: any; // Allow additional properties if needed
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity?: Entity;
  onSendInvite?: () => void;
  onEditProfile?: () => void;
  onPauseAccount?: () => void;
  onDeleteAccount?: () => void;
}

export default function ActionModal({
  isOpen,
  onClose,
  entity,
  onSendInvite,
  onEditProfile,
  onPauseAccount,
  onDeleteAccount
}: ActionModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !entity) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const entityName = entity.name || entity.companyName || entity.fullName || entity.code || 'User';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={handleBackdropClick}    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="action-modal-title" style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827'
        }}>
          Actions for {entityName}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="secondary"
            onClick={() => {
              if (onSendInvite) onSendInvite();
              onClose();
            }}
          >
            Send Invite
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              if (onEditProfile) onEditProfile();
              onClose();
            }}
          >
            Edit User Profile
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              if (onPauseAccount) onPauseAccount();
              onClose();
            }}
          >
            Pause Account
          </Button>

          <Button
            variant="danger"
            onClick={() => {
              if (onDeleteAccount) onDeleteAccount();
              onClose();
            }}
          >
            Delete User Account
          </Button>
        </div>

        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
