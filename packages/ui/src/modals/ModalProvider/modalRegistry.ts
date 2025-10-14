import ServiceModal from '../ServiceModal/ServiceModal';
import ProductModal from '../ProductModal/ProductModal';
import type { ServiceModalProps } from '../ServiceModal/ServiceModal';
import type { ProductModalProps } from '../ProductModal/ProductModal';

// Define all possible modal keys (used by DataTable's modalType prop)
export type ModalKey =
  | 'service-catalog'      // Catalog services view
  | 'service-my-services'  // My Services (with user certification)
  | 'service-history'      // Service history (completed/cancelled)
  | 'product-catalog'      // Catalog products view
  | 'product-inventory';   // Product inventory with stock levels

// Registry entry type
type RegistryEntry<T = any> = {
  Component: React.FC<T>;
  fromRow?: (row: any) => Omit<T, 'isOpen' | 'onClose'>;
};

// Modal registry - maps modalType to component + data transformer
export const modalRegistry: Record<ModalKey, RegistryEntry> = {
  // Service modals
  'service-catalog': {
    Component: ServiceModal,
    fromRow: (row: any): Omit<ServiceModalProps, 'isOpen' | 'onClose'> => ({
      service: {
        serviceId: row.serviceId || row.id,
        name: row.serviceName || row.name || row.serviceId,
        description: row.description || null,
        category: row.category || null,
        estimatedDuration: row.duration || row.estimatedDuration || null,
        requirements: row.requirements || null,
        status: row.status || 'active',
        metadata: row.metadata || null,
      },
      context: 'catalog',
    }),
  },

  'service-my-services': {
    Component: ServiceModal,
    fromRow: (row: any): Omit<ServiceModalProps, 'isOpen' | 'onClose'> => ({
      service: {
        serviceId: row.serviceId || row.id,
        name: row.serviceName || row.name || row.serviceId,
        description: row.description || null,
        category: row.category || null,
        estimatedDuration: row.duration || row.estimatedDuration || null,
        requirements: row.requirements || null,
        status: row.status || 'active',
        metadata: row.metadata || null,
      },
      userCertification: row.certified !== undefined ? {
        certified: row.certified === 'Yes' || row.certified === true,
        certificationDate: row.certificationDate || null,
        expiryDate: row.expires || null,
        trainingCompleted: true,
      } : undefined,
      context: 'myServices',
    }),
  },

  'service-history': {
    Component: ServiceModal,
    fromRow: (row: any): Omit<ServiceModalProps, 'isOpen' | 'onClose'> => ({
      service: {
        serviceId: row.serviceId || row.id,
        name: row.serviceName || row.name || row.serviceId,
        description: null,
        category: null,
        estimatedDuration: null,
        requirements: null,
        status: row.status || 'completed',
        metadata: null,
      },
      historyData: {
        instanceId: row.serviceId || row.id,
        status: row.status === 'cancelled' ? 'cancelled' : 'completed',
        completedAt: row.endDate || row.completedDate || null,
        cancelledAt: row.status === 'cancelled' ? (row.endDate || row.cancelledDate) : null,
        completionNotes: row.completionNotes || null,
        cancellationReason: row.cancellationReason || null,
        crew: row.crew || [],
        procedures: row.procedures || [],
        training: row.training || [],
        productOrdersCount: row.productOrdersCount || 0,
      },
      context: 'history',
    }),
  },

  // Product modals
  'product-catalog': {
    Component: ProductModal,
    fromRow: (row: any): Omit<ProductModalProps, 'isOpen' | 'onClose'> => ({
      product: {
        productId: row.productId || row.id,
        name: row.productName || row.name || row.productId,
        description: row.description || null,
        category: row.category || row.type || null,
        unitOfMeasure: row.unit || row.unitOfMeasure || 'EA',
        minimumOrderQuantity: row.minOrder || row.minimumOrderQuantity || null,
        leadTimeDays: row.leadTime || row.leadTimeDays || null,
        status: row.status || 'active',
        metadata: row.metadata || null,
      },
    }),
  },

  'product-inventory': {
    Component: ProductModal,
    fromRow: (row: any): Omit<ProductModalProps, 'isOpen' | 'onClose'> => ({
      product: {
        productId: row.productId || row.id,
        name: row.name || row.productId,
        description: row.description || null,
        category: row.type || row.category || null,
        unitOfMeasure: 'EA', // Default unit (actual unit not available in HubInventoryItem)
        minimumOrderQuantity: null, // Not available in HubInventoryItem
        leadTimeDays: null, // Not available in HubInventoryItem
        status: row.status || (row.archivedDate ? 'archived' : 'active'),
        metadata: row.metadata || null,
      },
      inventoryData: row.onHand !== undefined ? {
        warehouseId: 'WHS-001', // Default warehouse (not available in HubInventoryItem)
        warehouseName: null, // Not available in HubInventoryItem
        quantityOnHand: row.onHand || 0,
        quantityReserved: 0, // Not available in HubInventoryItem
        quantityAvailable: row.onHand || 0, // Use onHand as available (reserved not tracked)
        reorderPoint: row.min || null,
        location: row.location || null,
      } : undefined,
    }),
  },
};
