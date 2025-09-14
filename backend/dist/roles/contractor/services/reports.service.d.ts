/**
 * File: reports.service.ts
 *
 * Description: Selects allowed reports; prepares filters/params.
 * Function: Handle contractor reporting and analytics generation
 * Importance: Provides contractor business insights and performance metrics
 * Connects to: Report data sources/repos.
 */
export declare function getAvailableReports(contractorId: string): Promise<{
    reports: {
        id: string;
        name: string;
        description: string;
        category: string;
        parameters: string[];
    }[];
    categories: string[];
    permissions: {
        canExport: boolean;
        canSchedule: boolean;
        canShare: boolean;
    };
} | {
    reports: never[];
    categories: never[];
    permissions: {
        canExport?: undefined;
        canSchedule?: undefined;
        canShare?: undefined;
    };
}>;
export declare function generateReport(contractorId: string, reportType: string, parameters: any): Promise<{
    reportType: string;
    contractorId: string;
    dateRange: any;
    data: {
        totalJobs: number;
        completedJobs: number;
        averageRating: number;
        onTimeCompletion: number;
        topServices: never[];
    };
    generatedAt: Date;
} | {
    reportType: string;
    contractorId: string;
    dateRange: any;
    data: {
        totalEarnings: number;
        paidAmount: number;
        pendingAmount: number;
        monthlyBreakdown: never[];
        serviceBreakdown: never[];
    };
    generatedAt: Date;
} | {
    reportType: string;
    contractorId: string;
    dateRange: any;
    data: {
        averageRating: number;
        totalReviews: number;
        ratingDistribution: {};
        recentFeedback: never[];
        improvementAreas: never[];
    };
    generatedAt: Date;
}>;
//# sourceMappingURL=reports.service.d.ts.map