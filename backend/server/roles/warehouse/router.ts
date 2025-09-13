import { Router, RequestHandler } from 'express';
import warehouseRouter from '../../hubs/warehouse/routes';

export default function createWarehouseRouter(): Router | RequestHandler {
  return warehouseRouter;
}

