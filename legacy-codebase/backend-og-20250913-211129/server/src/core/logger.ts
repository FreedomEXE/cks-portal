import pino from 'pino';
import pinoHttp from 'pino-http';

export const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: process.env.NODE_ENV === 'development' 
    ? { target: 'pino-pretty' } 
    : undefined
});

export const httpLogger = pinoHttp({ logger });