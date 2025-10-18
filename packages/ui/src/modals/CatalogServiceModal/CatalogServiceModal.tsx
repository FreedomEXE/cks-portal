import React, { useState, useMemo } from 'react';
import BaseViewModal from '../BaseViewModal';
import ServiceCard from '../../cards/ServiceCard';
import ServiceQuickActions, { type CertifiedUser } from './components/ServiceQuickActions';
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
  onCertificationChange?: (role: RoleKey, userCode: string, certified: boolean) => void;
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
  onCertificationChange,
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
  const isAdminView = Boolean(onCertificationChange || onEdit || onDelete);

  // Tab state
  const [activeTab, setActiveTab] = useState(isAdminView ? 'quick-actions' : 'details');

  // Build tabs based on role
  const tabs = isAdminView
    ? [
        { id: 'quick-actions', label: 'Quick Actions' },
        { id: 'details', label: 'Details' },
      ]
    : [{ id: 'details', label: 'Details' }];

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
      {activeTab === 'quick-actions' && isAdminView && (
        <ServiceQuickActions
          managers={managersData}
          contractors={contractorsData}
          crew={crewData}
          warehouses={warehousesData}
          managedBy={managedBy}
          category={category}
          onCertificationChange={onCertificationChange}
          onEdit={onEdit}
          onDelete={onDelete}
        />
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
    </BaseViewModal>
  );
};

export default CatalogServiceModal;
