"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseConfig = void 0;
exports.WarehouseConfig = {
    role: {
        code: 'warehouse',
        name: 'Warehouse',
        description: 'Warehouse operations: inventory and deliveries',
        scope: 'entity',
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
            roleCode: 'warehouse',
        },
        deliveries: {
            capabilities: { view: 'delivery:track', update: 'delivery:update' },
            scope: 'entity',
            roleCode: 'warehouse',
        },
    },
};
//# sourceMappingURL=config.js.map