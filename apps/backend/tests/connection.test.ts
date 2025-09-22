import { describe, expect, it } from 'vitest';
import { query } from '../server/db/connection';

const shouldRun = Boolean(process.env.DATABASE_URL);

(shouldRun ? describe : describe.skip)('database connection', () => {
  it('executes SELECT 1', async () => {
    const result = await query<{ ping: number }>('SELECT 1 AS ping');
    expect(result.rows[0]?.ping).toBe(1);
  });
});
