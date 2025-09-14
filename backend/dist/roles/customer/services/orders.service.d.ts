/**
 * File: orders.service.service.ts
 *
 * Description: orders business logic for customer role
 * Function: Handle customer orders.service operations and business rules
 * Importance: Core business logic for customer orders.service functionality
 * Connects to: orders.service.repo.ts, validators
 */
export declare function getOrdersData(customerId: string): Promise<{
    message: string;
    customerId: string;
    timestamp: Date;
    data: never[];
}>;
//# sourceMappingURL=orders.service.d.ts.map