import { Router, RequestHandler } from 'express';
import managerRouter from '../../hubs/manager/routes';

export default function createManagerRouter(): Router | RequestHandler {
  return managerRouter;
}

