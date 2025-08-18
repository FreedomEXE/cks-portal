/**
 * File: core/errors.ts
 *
 * Descriptio:
 *   Central error constructs and middleware for consistent API error responses.
 * Functionality:
 *   Defines AppError for controlled failures, notFound handler, and errorHandler for logging + JSON formatting.
 * Importance:
 *   Standardizes error shape, prevents leaking internals, and ensures server issues are logged.
 * Conections:
 *   Applied at the end of Express middleware chain; logger depends on core/logger.
 * Notes:
 *   Consider enriching error responses with correlation IDs when tracing is added.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';

export class AppError extends Error {
  status: number;
  expose: boolean;
  constructor(message: string, status = 500, expose = false) {
    super(message);
    this.status = status;
    this.expose = expose;
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) logger.error({ err }, 'Unhandled error');
  res.status(status).json({ error: err.expose ? err.message : status >= 500 ? 'Internal Server Error' : err.message });
}
