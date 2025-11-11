import React, { useState } from 'react';
import BaseViewModal from '../BaseViewModal';
import UserCard, { type UserAction } from '../../cards/UserCard';
import UserQuickActions from './UserQuickActions';
import ActionBar, { type ActionDescriptor } from '../components/ActionBar/ActionBar';

export interface User {
  id: string;
  name: string;
  status?: string;
  role?: string;
  profileData?: any;
}

export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  actions: UserAction[];
  profileData?: any;
  onUpdatePhoto?: () => void;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  actions,
  profileData,
  onUpdatePhoto,
}) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen || !user) return null;

  const tabs: Array<{ id: string; label: string }> = [
    { id: 'profile', label: 'Profile' },
  ];

  const card = (
    <UserCard
      userId={user.id}
      userName={user.name}
      status={user.status}
      userRole={user.role}
      variant="embedded"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  return (
    <BaseViewModal isOpen={isOpen} onClose={onClose} card={card}>
      {/* Embedded actions bar visible on all tabs */}
      {actions && actions.length ? (
        <div style={{ padding: '0 16px' }}>
          <ActionBar
            actions={actions.map(a => ({ label: a.label, onClick: a.onClick, variant: a.variant as ActionDescriptor['variant'], disabled: a.disabled }))}
          />
        </div>
      ) : null}
      {activeTab === 'profile' && (
        profileData ? (
          <div style={{ padding: '0' }}>
            {profileData}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280' }}>
            Profile data not available
          </div>
        )
      )}
    </BaseViewModal>
  );
};

export default UserModal;
