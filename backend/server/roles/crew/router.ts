import { Router, RequestHandler } from 'express';
import crewRouter from '../../hubs/crew/routes';

export default function createCrewRouter(): Router | RequestHandler {
  return crewRouter;
}

