/**
 * CatalogServiceQuickActionsWrapper
 *
 * Fetches directory data and renders ServiceQuickActions component
 * for the universal modal system.
 */

import React from 'react';
import { ServiceQuickActions, type CertificationChanges } from '@cks/ui';
import { useManagers, useContractors, useCrew, useWarehouses } from '../../../apps/frontend/src/shared/api/directory';

export interface CatalogServiceQuickActionsWrapperProps {
  serviceData: any;
  onSave?: (changes: CertificationChanges) => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CatalogServiceQuickActionsWrapper({
  serviceData,
  onSave,
  onEdit,
  onDelete,
}: CatalogServiceQuickActionsWrapperProps) {
  // Fetch directory data
  const { managers: managersData } = useManagers();
  const { contractors: contractorsData } = useContractors();
  const { crew: crewData } = useCrew();
  const { warehouses: warehousesData } = useWarehouses();

  // Extract certification data from service
  const certifications = serviceData?.certifications || {
    managers: [],
    contractors: [],
    crew: [],
    warehouses: [],
  };

  // Map directory data to the format ServiceQuickActions expects
  const peopleManagers = managersData?.map((m: any) => ({
    code: m.managerId || m.id,
    name: m.fullName || m.name || 'Unknown',
  })) || [];

  const peopleContractors = contractorsData?.map((c: any) => ({
    code: c.contractorId || c.id,
    name: c.fullName || c.name || 'Unknown',
  })) || [];

  const peopleCrew = crewData?.map((c: any) => ({
    code: c.crewId || c.id,
    name: c.name || 'Unknown',
  })) || [];

  const peopleWarehouses = warehousesData?.map((w: any) => ({
    code: w.warehouseId || w.id,
    name: w.name || 'Unknown',
  })) || [];

  return (
    <ServiceQuickActions
      managers={peopleManagers}
      contractors={peopleContractors}
      crew={peopleCrew}
      warehouses={peopleWarehouses}
      managedBy={serviceData?.managedBy || 'manager'}
      category={serviceData?.category || ''}
      onSave={onSave}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
