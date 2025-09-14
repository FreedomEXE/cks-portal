export declare function getServices(contractorId: string): Promise<any[]>;
export declare function createService(contractorId: string, serviceData: any): Promise<any>;
export declare function updateService(contractorId: string, serviceId: string, updateData: any): Promise<any>;
export declare function deleteService(contractorId: string, serviceId: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function getServiceCategories(): Promise<string[]>;
//# sourceMappingURL=services.service.d.ts.map