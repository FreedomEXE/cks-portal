import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ActivityModalGateway from '../components/ActivityModalGateway';
import { ReportModal, ServiceDetailsModal, ServiceViewModal } from '@cks/ui';
import { useReportDetails } from '../hooks/useReportDetails';
import { useServiceDetails } from '../hooks/useServiceDetails';
import { useEntityActions } from '../hooks/useEntityActions';

/**
 * ModalProvider - Centralized modal state management
 *
 * Eliminates need for each hub to manage modal state and render modals.
 * Any component can open modals using useModals() hook.
 *
 * Phase 2: Report/Feedback Modals
 * Phase 3: Service Modals
 */

export interface ModalContextValue {
  // Order Modals (via ActivityModalGateway)
  openOrderModal: (orderId: string) => void;
  closeOrderModal: () => void;

  // Report Modals
  openReportModal: (reportId: string, reportType: 'report' | 'feedback') => void;
  closeReportModal: () => void;

  // Service Modals
  openServiceModal: (serviceId: string, editable?: boolean) => void;
  closeServiceModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export interface ModalProviderProps {
  children: ReactNode;
  currentUser: string;
  role?: 'user' | 'admin';
  reportsData?: any; // SWR data for reports
  ordersData?: any; // SWR data for orders (includes service orders)
  availableCrew?: Array<{ code: string; name: string }>; // For manager service management
  onEdit?: (order: any) => void;
  onArchive?: (orderId: string, reason?: string) => Promise<void> | void;
  onRestore?: (orderId: string) => Promise<void> | void;
  onDelete?: (orderId: string) => Promise<void> | void;
  onServiceSave?: (serviceId: string, updates: any) => Promise<void> | void;
  onServiceAction?: (serviceId: string, action: 'start' | 'complete' | 'cancel') => Promise<void> | void;
  onSendCrewRequest?: (serviceId: string, crewCodes: string[]) => Promise<void> | void;
}

export function ModalProvider({
  children,
  currentUser,
  role = 'user',
  reportsData,
  ordersData,
  availableCrew = [],
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onServiceSave,
  onServiceAction,
  onSendCrewRequest,
}: ModalProviderProps) {
  // State for each modal type
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<{ id: string; type: 'report' | 'feedback' } | null>(null);
  const [selectedService, setSelectedService] = useState<{ id: string; editable: boolean } | null>(null);

  // Fetch report details when report modal is open
  const { report: reportDetails } = useReportDetails({
    reportId: selectedReport?.id || null,
    reportType: selectedReport?.type || null,
    reportsData,
  });

  // Fetch service details when service modal is open
  const { service: serviceDetails } = useServiceDetails({
    serviceId: selectedService?.id || null,
    ordersData,
  });

  // Use centralized entity actions hook
  const { handleAction } = useEntityActions();

  // Context value
  const value: ModalContextValue = {
    openOrderModal: useCallback((id: string) => setSelectedOrderId(id), []),
    closeOrderModal: useCallback(() => setSelectedOrderId(null), []),

    openReportModal: useCallback((id: string, type: 'report' | 'feedback') => {
      setSelectedReport({ id, type });
    }, []),
    closeReportModal: useCallback(() => setSelectedReport(null), []),

    openServiceModal: useCallback((id: string, editable: boolean = false) => {
      setSelectedService({ id, editable });
    }, []),
    closeServiceModal: useCallback(() => setSelectedService(null), []),
  };

  return (
    <ModalContext.Provider value={value}>
      {children}

      {/* Order Modal - Rendered via ActivityModalGateway */}
      <ActivityModalGateway
        isOpen={!!selectedOrderId}
        onClose={value.closeOrderModal}
        orderId={selectedOrderId}
        role={role}
        onAction={handleAction}
        onEdit={onEdit}
        onArchive={onArchive}
        onRestore={onRestore}
        onDelete={onDelete}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={!!selectedReport}
        onClose={value.closeReportModal}
        report={reportDetails}
        currentUser={currentUser}
        showQuickActions={true}
      />

      {/* Service Details Modal (Manager - Editable) */}
      {selectedService?.editable && (
        <ServiceDetailsModal
          isOpen={!!selectedService && selectedService.editable}
          onClose={value.closeServiceModal}
          service={serviceDetails}
          editable={true}
          availableCrew={availableCrew}
          serviceStatus={serviceDetails?.metadata?.serviceStatus || 'created'}
          serviceType={serviceDetails?.metadata?.serviceType || 'one-time'}
          productOrders={[]} // TODO: Get product orders from ordersData
          onSave={onServiceSave ? async (updates) => {
            if (selectedService?.id) {
              await onServiceSave(selectedService.id, updates);
            }
          } : undefined}
          onSendCrewRequest={onSendCrewRequest ? async (crewCodes) => {
            if (selectedService?.id) {
              await onSendCrewRequest(selectedService.id, crewCodes);
            }
          } : undefined}
          onStartService={onServiceAction ? async () => {
            if (selectedService?.id) {
              await onServiceAction(selectedService.id, 'start');
            }
          } : undefined}
          onCompleteService={onServiceAction ? async () => {
            if (selectedService?.id) {
              await onServiceAction(selectedService.id, 'complete');
            }
          } : undefined}
          onCancelService={onServiceAction ? async () => {
            if (selectedService?.id) {
              await onServiceAction(selectedService.id, 'cancel');
            }
          } : undefined}
        />
      )}

      {/* Service View Modal (All Other Roles - Read-Only) */}
      {selectedService && !selectedService.editable && (
        <ServiceViewModal
          isOpen={!!selectedService && !selectedService.editable}
          onClose={value.closeServiceModal}
          service={serviceDetails}
          showProductsSection={true}
        />
      )}
    </ModalContext.Provider>
  );
}

/**
 * Hook to access modal functions from any component
 * Must be used within ModalProvider
 */
export function useModals() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModals must be used within ModalProvider');
  }
  return context;
}
