import { Router, RequestHandler } from 'express';
import contractorRouter from '../../hubs/contractor/routes';

export default function createContractorRouter(): Router | RequestHandler {
  return contractorRouter;
}

