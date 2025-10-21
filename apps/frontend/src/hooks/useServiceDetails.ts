import { useMemo } from 'react';

export interface UseServiceDetailsOptions {
  serviceId: string | null;
  ordersData?: any; // SWR data containing service orders
}

/**
 * Hook to fetch service details from hub orders data
 * Similar pattern to useReportDetails
 */
export function useServiceDetails({ serviceId, ordersData }: UseServiceDetailsOptions) {
  const service = useMemo(() => {
    if (!serviceId || !ordersData?.serviceOrders) {
      return null;
    }

    // Find the service order that matches this serviceId
    const serviceOrder = ordersData.serviceOrders.find((order: any) => {
      const orderServiceId = order.serviceId || order.transformedId;
      return orderServiceId === serviceId;
    });

    if (!serviceOrder) {
      return null;
    }

    // Transform to service details format
    const metadata = serviceOrder.metadata || {};

    return {
      serviceId: serviceOrder.serviceId || serviceOrder.transformedId,
      title: serviceOrder.title || serviceOrder.serviceId,
      centerId: serviceOrder.centerId || metadata.centerId,
      metadata: {
        ...metadata,
        serviceStatus: metadata.serviceStatus || serviceOrder.status,
        serviceType: metadata.serviceType || 'one-time',
        crew: metadata.crew || [],
        crewRequests: metadata.crewRequests || [],
        procedures: metadata.procedures || [],
        training: metadata.training || [],
        notes: metadata.notes || '',
        serviceStartDate: metadata.serviceStartDate || metadata.actualStartDate,
        centerName: metadata.centerName,
        managerName: metadata.managerName,
        managerId: metadata.managerId,
        warehouseId: metadata.warehouseId,
        warehouseName: metadata.warehouseName,
      },
    };
  }, [serviceId, ordersData]);

  return { service };
}
