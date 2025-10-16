import React from 'react';
import Button from '../../buttons/Button';
import { ModalRoot } from '../ModalRoot';

interface Entity {
  name?: string;
  companyName?: string;
  fullName?: string;
  code?: string;
  orderId?: string;
  product_name?: string;
  service_name?: string;
  [key: string]: any; // Allow additional properties if needed
}

export interface ActionItem {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick: () => void;
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity?: Entity;
  title?: string;
  actions?: ActionItem[];
  // Legacy props for backward compatibility
  onSendInvite?: () => void;
  onEditProfile?: () => void;
  onPauseAccount?: () => void;
  onDeleteAccount?: () => void;
}

export default function ActionModal({
  isOpen,
  onClose,
  entity,
  title,
  actions,
  onSendInvite,
  onEditProfile,
  onPauseAccount,
  onDeleteAccount
}: ActionModalProps) {
  if (!entity) return null;

  const entityName = entity.name || entity.companyName || entity.fullName ||
                     entity.code || entity.orderId || entity.product_name ||
                     entity.service_name || 'Entity';

  // Use custom actions if provided, otherwise fall back to legacy behavior
  const modalActions = actions || [
    ...(onSendInvite ? [{
      label: 'Send Invite',
      variant: 'secondary' as const,
      onClick: onSendInvite
    }] : []),
    ...(onEditProfile ? [{
      label: 'Edit User Profile',
      variant: 'secondary' as const,
      onClick: onEditProfile
    }] : []),
    ...(onPauseAccount ? [{
      label: 'Pause Account',
      variant: 'secondary' as const,
      onClick: onPauseAccount
    }] : []),
    ...(onDeleteAccount ? [{
      label: 'Delete User Account',
      variant: 'danger' as const,
      onClick: onDeleteAccount
    }] : [])
  ];

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '400px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h3 id="action-modal-title" style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827'
        }}>
          {title || `Actions for ${entityName}`}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modalActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </Button>
          ))}
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
    </ModalRoot>
  );
}
