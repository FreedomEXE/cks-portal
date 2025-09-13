import { Router, RequestHandler } from 'express';
import customerRouter from '../../hubs/customer/routes';

export default function createCustomerRouter(): Router | RequestHandler {
  return customerRouter;
}

