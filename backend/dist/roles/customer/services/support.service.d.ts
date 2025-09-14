/**
 * File: support.service.service.ts
 *
 * Description: support business logic for customer role
 * Function: Handle customer support.service operations and business rules
 * Importance: Core business logic for customer support.service functionality
 * Connects to: support.service.repo.ts, validators
 */
export declare function getSupportData(customerId: string): Promise<{
    message: string;
    customerId: string;
    timestamp: Date;
    data: never[];
}>;
//# sourceMappingURL=support.service.d.ts.map