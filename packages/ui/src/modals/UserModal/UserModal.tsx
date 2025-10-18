import React, { useState } from 'react';
import BaseViewModal from '../BaseViewModal';
import UserCard, { type UserAction } from '../../cards/UserCard';
import UserQuickActions from './UserQuickActions';

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
  const [activeTab, setActiveTab] = useState('quick-actions');

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'quick-actions', label: 'Quick Actions' },
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
      {activeTab === 'quick-actions' && <UserQuickActions actions={actions} />}
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
