import { Router, RequestHandler } from 'express';
import centerRouter from '../../hubs/center/routes';

export default function createCenterRouter(): Router | RequestHandler {
  return centerRouter;
}

