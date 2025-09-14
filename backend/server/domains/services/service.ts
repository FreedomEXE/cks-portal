import { ServiceEntity, ServicesQuery } from './types';
import * as repo from './repository';

export async function list(query: ServicesQuery): Promise<ServiceEntity[]> {
  const q: ServicesQuery = {
    ...query,
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    offset: Math.max(query.offset || 0, 0),
  };
  return await repo.listServices(q);
}

export async function get(serviceId: number): Promise<ServiceEntity | null> {
  return await repo.getService(serviceId);
}

export async function update(serviceId: number, updates: Partial<ServiceEntity>): Promise<ServiceEntity | null> {
  return await repo.updateService(serviceId, updates);
}

