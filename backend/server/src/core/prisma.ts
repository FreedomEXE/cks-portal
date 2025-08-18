/**
 * File: core/prisma.ts
 *
 * Descriptio:
 *   Lazy-initialized Prisma Client singleton accessor.
 * Functionality:
 *   Provides getPrisma() and disconnectPrisma() with basic logging of query/runtime errors.
 * Importance:
 *   Ensures a single Prisma instance (avoiding connection exhaustion) and central place for instrumentation.
 * Conections:
 *   Used by Fastify server routes and any repository layer replacing raw SQL.
 * Notes:
 *   Consider enabling query logging redaction if PII enters the schema.
 */
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import Prisma from '@prisma/client';
const { PrismaClient } = Prisma as any;
import { logger } from './logger';

// Singleton Prisma client
type PrismaClientType = InstanceType<typeof PrismaClient>;
let prisma: PrismaClientType | null = null;

export function getPrisma(): PrismaClientType {
  if (!prisma) {
  prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query','error','warn'] : ['error']
    });
  prisma.$on('error', (e: any) => logger.error({ prisma: true, ...e }, 'Prisma error'));
  }
  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
