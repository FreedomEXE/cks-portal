import { Router, Request, Response, NextFunction } from 'express';
import createAdminRouter from '../roles/admin/router';
import createManagerRouter from '../roles/manager/router';
import createContractorRouter from '../roles/contractor/router';
import createCustomerRouter from '../roles/customer/router';
import createCenterRouter from '../roles/center/router';
import createCrewRouter from '../roles/crew/router';
import createWarehouseRouter from '../roles/warehouse/router';

export type RoleKey = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

// Build the role router registry once at startup
const registry: Record<RoleKey, Router | ((req: Request, res: Response, next: NextFunction) => void)> = {
  admin: createAdminRouter(),
  manager: createManagerRouter(),
  contractor: createContractorRouter(),
  customer: createCustomerRouter(),
  center: createCenterRouter(),
  crew: createCrewRouter(),
  warehouse: createWarehouseRouter(),
};

export function getRoleRouter(role: string) {
  const key = role?.toLowerCase?.() as RoleKey;
  return registry[key];
}

