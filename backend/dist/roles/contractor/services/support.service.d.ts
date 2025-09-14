export declare function getSupportResources(contractorId: string): Promise<{
    quickHelp: {
        title: string;
        description: string;
        category: string;
        url: string;
    }[];
    contactOptions: ({
        type: string;
        label: string;
        available: boolean;
        hours: string;
        address?: undefined;
        number?: undefined;
    } | {
        type: string;
        label: string;
        available: boolean;
        address: string;
        hours?: undefined;
        number?: undefined;
    } | {
        type: string;
        label: string;
        available: boolean;
        number: string;
        hours?: undefined;
        address?: undefined;
    })[];
    announcements: {
        title: string;
        date: Date;
        type: string;
        message: string;
    }[];
}>;
export declare function createSupportTicket(contractorId: string, ticketData: any): Promise<{
    id: string;
    contractorId: string;
    subject: any;
    description: any;
    category: any;
    priority: any;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function getKnowledgeBase(contractorId: string, searchParams: any): Promise<{
    articles: {
        id: string;
        title: string;
        category: string;
        summary: string;
        lastUpdated: Date;
        helpful: number;
        views: number;
    }[];
    total: number;
    categories: string[];
    searchTerm: any;
}>;
//# sourceMappingURL=support.service.d.ts.map