export declare function getServices(contractorId: string): Promise<any[]>;
export declare function getServiceById(contractorId: string, serviceId: string): Promise<any>;
export declare function createService(contractorId: string, serviceData: any): Promise<any>;
export declare function updateService(contractorId: string, serviceId: string, updateData: any): Promise<any>;
export declare function deleteService(contractorId: string, serviceId: string): Promise<void>;
export declare function getServiceCategories(): Promise<string[]>;
export declare function getPopularServices(contractorId: string, limit?: number): Promise<any[]>;
//# sourceMappingURL=services.repo.d.ts.map