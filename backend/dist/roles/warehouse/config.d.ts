export declare const WarehouseConfig: {
    role: {
        code: string;
        name: string;
        description: string;
        scope: "entity";
    };
    capabilities: {
        inventory: {
            view: string;
            adjust: string;
        };
        deliveries: {
            view: string;
            update: string;
        };
    };
    domains: {
        inventory: {
            capabilities: {
                view: string;
                adjust: string;
            };
            scope: string;
            roleCode: "warehouse";
        };
        deliveries: {
            capabilities: {
                view: string;
                update: string;
            };
            scope: string;
            roleCode: "warehouse";
        };
    };
};
//# sourceMappingURL=config.d.ts.map