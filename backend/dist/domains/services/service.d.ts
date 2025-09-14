import { ServiceEntity, ServicesQuery } from './types';
export declare function list(query: ServicesQuery): Promise<ServiceEntity[]>;
export declare function get(serviceId: number): Promise<ServiceEntity | null>;
export declare function update(serviceId: number, updates: Partial<ServiceEntity>): Promise<ServiceEntity | null>;
//# sourceMappingURL=service.d.ts.map