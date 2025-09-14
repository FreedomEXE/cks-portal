export const WarehouseConfig = {
  role: {
    code: 'warehouse',
    name: 'Warehouse',
    description: 'Warehouse operations: inventory and deliveries',
    scope: 'entity' as const,
  },
  capabilities: {
    inventory: {
      view: 'inventory:view',
      adjust: 'inventory:adjust',
    },
    deliveries: {
      view: 'delivery:track',
      update: 'delivery:update',
    },
  },
  domains: {
    inventory: {
      capabilities: { view: 'inventory:view', adjust: 'inventory:adjust' },
      scope: 'entity',
      roleCode: 'warehouse' as const,
    },
    deliveries: {
      capabilities: { view: 'delivery:track', update: 'delivery:update' },
      scope: 'entity',
      roleCode: 'warehouse' as const,
    },
  },
};

