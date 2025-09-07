import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  logger.error({
    err: error,
    req: { method: req.method, url: req.originalUrl }
  }, 'Request error');

  res.status(statusCode).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
}