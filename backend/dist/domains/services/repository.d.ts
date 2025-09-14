import { ServiceEntity, ServicesQuery } from './types';
export declare function listServices(query: ServicesQuery): Promise<ServiceEntity[]>;
export declare function getService(serviceId: number): Promise<ServiceEntity | null>;
export declare function updateService(serviceId: number, updates: Partial<Pick<ServiceEntity, 'service_name' | 'description' | 'price' | 'status' | 'unit' | 'category_id'>>): Promise<ServiceEntity | null>;
//# sourceMappingURL=repository.d.ts.map