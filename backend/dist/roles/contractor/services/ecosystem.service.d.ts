/**
 * File: ecosystem.service.ts
 *
 * Description: Composes related data (customers, centers, opportunities) for Ecosystem tab.
 * Function: Aggregate ecosystem relationships for contractor view
 * Importance: Enables contractor network visibility and business opportunities
 * Connects to: Multiple repos; caches if needed.
 */
export declare function getEcosystemData(contractorId: string): Promise<{
    customers: never[];
    centers: never[];
    opportunities: never[];
    relationships: {
        activeCustomers: number;
        preferredCenters: number;
        totalOpportunities: number;
    };
    networkHealth: {
        score: number;
        status: string;
        recommendations: never[];
    };
}>;
export declare function getOpportunities(contractorId: string): Promise<{
    openJobs: never[];
    invitations: never[];
    recommendations: never[];
    filters: {
        location: never[];
        serviceType: never[];
        payRange: never[];
    };
}>;
//# sourceMappingURL=ecosystem.service.d.ts.map