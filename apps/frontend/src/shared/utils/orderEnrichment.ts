/**
 * Order Enrichment Utilities
 *
 * Enriches order data with contact information from directory arrays.
 * Used by AdminHub to pre-enrich orders before passing to useOrderDetails hook.
 */

interface DirectoryEntity {
  code?: string;
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface EnrichmentContext {
  centers?: DirectoryEntity[];
  customers?: DirectoryEntity[];
  crews?: any[];
  warehouses?: DirectoryEntity[];
  contractors?: any[];
}

/**
 * Find entity in directory arrays by code
 */
function findInDirectory(code: string | null, context: EnrichmentContext): DirectoryEntity | null {
  if (!code) return null;

  const normalizedCode = code.toUpperCase();

  // Check all directory arrays
  const allEntities = [
    ...(context.centers || []),
    ...(context.customers || []),
    ...(context.crews || []),
    ...(context.warehouses || []),
    ...(context.contractors || []),
  ];

  return allEntities.find(
    (entity) =>
      (entity.code?.toUpperCase() === normalizedCode) ||
      (entity.id?.toUpperCase() === normalizedCode)
  ) || null;
}

/**
 * Enrich order with contact information from directory
 */
export function enrichOrderWithDirectory(order: any, context: EnrichmentContext): any {
  if (!order) return order;

  // Clone order to avoid mutations
  const enrichedOrder = { ...order };

  // Ensure metadata structure exists
  if (!enrichedOrder.metadata) {
    enrichedOrder.metadata = {};
  }
  if (!enrichedOrder.metadata.contacts) {
    enrichedOrder.metadata.contacts = {};
  }

  // Enrich requestor info
  const requestorCode = order.requestedBy || order.requested_by;
  const requestorEntity = findInDirectory(requestorCode, context);

  if (requestorEntity && !enrichedOrder.metadata.contacts.requestor) {
    enrichedOrder.metadata.contacts.requestor = {
      name: requestorEntity.name || requestorCode,
      address: requestorEntity.address || null,
      phone: requestorEntity.phone || null,
      email: requestorEntity.email || null,
    };
  }

  // Enrich destination info
  const destinationCode = order.destination || order.centerId || order.center_id;
  const destinationEntity = findInDirectory(destinationCode, context);

  if (destinationEntity && !enrichedOrder.metadata.contacts.destination) {
    enrichedOrder.metadata.contacts.destination = {
      name: destinationEntity.name || destinationCode,
      address: destinationEntity.address || null,
      phone: destinationEntity.phone || null,
      email: destinationEntity.email || null,
    };
  }

  return enrichedOrder;
}
