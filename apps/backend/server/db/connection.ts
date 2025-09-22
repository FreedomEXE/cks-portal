import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';

interface LoggerLike {
  info?: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

const logger: LoggerLike = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const maybeLogger = require('../core/logging/logger');
    if (maybeLogger?.logger) {
      return maybeLogger.logger as LoggerLike;
    }
    if (maybeLogger?.default) {
      return maybeLogger.default as LoggerLike;
    }
  } catch (error: unknown) {
    console.warn('[db] logger module unavailable, falling back to console');
  }
  return console;
})();

const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY_MS = 500;

let pool: Pool | null = null;
let poolPromise: Promise<Pool> | null = null;
let shutdownRegistered = false;

function buildPoolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  return {
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  } satisfies PoolConfig;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createPool(): Promise<Pool> {
  const config = buildPoolConfig();
  const nextPool = new Pool(config);

  nextPool.on('error', (error: unknown) => {
    logger.error?.('[db] unexpected error on idle client', error);
  });

  for (let attempt = 1; attempt <= MAX_CONNECTION_ATTEMPTS; attempt += 1) {
    try {
      await nextPool.query('SELECT 1');
      break;
    } catch (error: unknown) {
      logger.error?.(`[db] connection attempt ${attempt} failed`, error);
      if (attempt === MAX_CONNECTION_ATTEMPTS) {
        await nextPool.end().catch(() => undefined);
        throw error;
      }
      await delay(CONNECTION_RETRY_DELAY_MS * attempt);
    }
  }

  registerShutdown(nextPool);
  pool = nextPool;
  return nextPool;
}

function registerShutdown(currentPool: Pool) {
  if (shutdownRegistered) {
    return;
  }
  shutdownRegistered = true;

  const shutdown = async (signal: NodeJS.Signals) => {
    try {
      logger.info?.(`[db] received ${signal}, closing pool`);
      await currentPool.end();
    } catch (error: unknown) {
      logger.error?.('[db] failed to close pool during shutdown', error);
    } finally {
      pool = null;
      poolPromise = null;
    }
  };

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.once(signal as NodeJS.Signals, () => {
      shutdown(signal as NodeJS.Signals).catch((error: unknown) => {
        logger.error?.('[db] shutdown handler error', error);
      });
    });
  });
}

async function ensurePool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  if (!poolPromise) {
    poolPromise = createPool().catch((error) => {
      poolPromise = null;
      throw error;
    });
  }

  return poolPromise;
}

export async function getConnection(): Promise<Pool> {
  return ensurePool();
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<T>> {
  const activePool = await ensurePool();
  try {
    return await activePool.query<T>(text, params as any[]);
  } catch (error: unknown) {
    logger.error?.('[db] query failed', { text, error });
    throw error;
  }
}

