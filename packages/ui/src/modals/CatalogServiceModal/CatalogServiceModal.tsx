import React, { useState, useMemo } from 'react';
import BaseViewModal from '../BaseViewModal';
import ServiceCard from '../../cards/ServiceCard';
import ServiceQuickActions, { type CertifiedUser, type CertificationChanges } from './components/ServiceQuickActions';
import ActionBar from '../components/ActionBar/ActionBar';
import ServiceDetails from './components/ServiceDetails';

export type RoleKey = 'manager' | 'contractor' | 'crew' | 'warehouse';

export interface CatalogService {
  serviceId: string;
  name: string | null;
  category: string | null;
  status?: string | null;
  description?: string | null;
  metadata?: any;
}

export interface CatalogServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: CatalogService | null;
  // Admin-only props
  onSave?: (changes: CertificationChanges) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => void;
  // User lists for certifications (admin only)
  peopleManagers?: Array<{ code: string; name: string }>;
  peopleContractors?: Array<{ code: string; name: string }>;
  peopleCrew?: Array<{ code: string; name: string }>;
  peopleWarehouses?: Array<{ code: string; name: string }>;
  // Current certifications (admin only)
  certifiedManagers?: string[];
  certifiedContractors?: string[];
  certifiedCrew?: string[];
  certifiedWarehouses?: string[];
}

const CatalogServiceModal: React.FC<CatalogServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  onSave,
  onEdit,
  onDelete,
  peopleManagers = [],
  peopleContractors = [],
  peopleCrew = [],
  peopleWarehouses = [],
  certifiedManagers = [],
  certifiedContractors = [],
  certifiedCrew = [],
  certifiedWarehouses = [],
}) => {
  // Determine if admin view (has admin callbacks)
  const isAdminView = Boolean(onSave || onEdit || onDelete);

  // Tab state
  const [activeTab, setActiveTab] = useState('details');

  // Build tabs based on role
  const tabs = [{ id: 'details', label: 'Details' }];

  // Transform user lists into CertifiedUser[] arrays for Quick Actions
  const buildCertifiedUsers = (
    allUsers: Array<{ code: string; name: string }>,
    certifiedCodes: string[]
  ): CertifiedUser[] => {
    const certifiedSet = new Set(certifiedCodes);
    return allUsers.map((u) => ({
      code: u.code,
      name: u.name,
      isCertified: certifiedSet.has(u.code),
    }));
  };

  const managersData = useMemo(
    () => buildCertifiedUsers(peopleManagers, certifiedManagers),
    [peopleManagers, certifiedManagers]
  );

  const contractorsData = useMemo(
    () => buildCertifiedUsers(peopleContractors, certifiedContractors),
    [peopleContractors, certifiedContractors]
  );

  const crewData = useMemo(
    () => buildCertifiedUsers(peopleCrew, certifiedCrew),
    [peopleCrew, certifiedCrew]
  );

  const warehousesData = useMemo(
    () => buildCertifiedUsers(peopleWarehouses, certifiedWarehouses),
    [peopleWarehouses, certifiedWarehouses]
  );

  // Early return AFTER all hooks
  if (!isOpen || !service) return null;

  // ServiceCard for header
  const card = (
    <ServiceCard
      serviceId={service.serviceId}
      serviceName={service.name || 'Unnamed Service'}
      category={service.category || undefined}
      managedBy={service.metadata?.managedBy || 'manager'}
      status={service.status || 'active'}
      variant="embedded"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );

  const managedBy = service.metadata?.managedBy || 'manager';
  const category = service.category || '';

  return (
    <BaseViewModal isOpen={isOpen} onClose={onClose} card={card}>
      {/* Embedded header actions */}
      {(onEdit || onDelete) && (
        <div style={{ padding: '0 16px' }}>
          <ActionBar
            actions={[
              onEdit ? { label: 'Edit', onClick: onEdit, variant: 'secondary' } : null,
              onDelete ? { label: 'Delete', onClick: onDelete, variant: 'danger' } : null,
            ].filter(Boolean) as any}
          />
        </div>
      )}

      {activeTab === 'details' && (
        <ServiceDetails
          serviceId={service.serviceId}
          serviceName={service.name || 'Unnamed Service'}
          category={service.category || undefined}
          status={service.status || 'active'}
          managedBy={managedBy}
          description={service.description || undefined}
        />
      )}
      {/* Optional admin-only quick-edit section remains in content */}
      {isAdminView && (
        <div style={{ marginTop: 16 }}>
          <ServiceQuickActions
            managers={managersData}
            contractors={contractorsData}
            crew={crewData}
            warehouses={warehousesData}
            managedBy={managedBy}
            category={category}
            onSave={onSave}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
    </BaseViewModal>
  );
};

export default CatalogServiceModal;
