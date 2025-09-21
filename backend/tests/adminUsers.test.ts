import { describe, expect, it } from 'vitest';
import { getConnection } from '../server/db/connection';
import {
  createAdminUser,
  getAdminUserById,
  removeAdminUser,
  setAdminUserStatus,
} from '../server/domains/adminUsers/store';

const shouldRun = Boolean(process.env.DATABASE_URL);

const SEEDED_ADMIN_ID = 'user_30zQMJoQqhzVJEgWRUgen7SsSnY';

async function tableExists(): Promise<boolean> {
  try {
    const pool = await getConnection();
    const result = await pool.query('SELECT 1 FROM admin_users LIMIT 1');
    return result.rowCount !== undefined;
  } catch (error: any) {
    if (error?.code === '42P01') {
      // relation does not exist
      return false;
    }
    throw error;
  }
}

(shouldRun ? describe : describe.skip)('adminUsers store', () => {
  it('reads seeded admin user when available', async () => {
    if (!(await tableExists())) {
      console.warn('[adminUsers.test] admin_users table missing, skipping seeded check');
      return;
    }

    const seeded = await getAdminUserById(SEEDED_ADMIN_ID);
    if (!seeded) {
      console.warn('[adminUsers.test] seeded admin missing, skipping assertion');
      return;
    }

    expect(seeded.status).toBe('active');
    expect(seeded.cksCode.toUpperCase()).toBe('ADM-001');
  });

  it('updates status transitions for seeded admin', async () => {
    if (!(await tableExists())) {
      return;
    }

    const seeded = await getAdminUserById(SEEDED_ADMIN_ID);
    if (!seeded) {
      return;
    }

    const suspended = await setAdminUserStatus(SEEDED_ADMIN_ID, 'suspended');
    expect(suspended?.status).toBe('suspended');

    const restored = await setAdminUserStatus(SEEDED_ADMIN_ID, 'active');
    expect(restored?.status).toBe('active');
  });

  it('creates and reads admin users', async () => {
    if (!(await tableExists())) {
      console.warn('[adminUsers.test] admin_users table missing, skipping test');
      return;
    }

    const uniqueSuffix = Date.now();
    const clerkUserId = `user_${uniqueSuffix}`;
    const cksCode = `adm-${uniqueSuffix}`;
    const email = `admin.test+${uniqueSuffix}@example.com`;

    try {
      const created = await createAdminUser({
        clerkUserId,
        cksCode,
        email,
        status: 'active',
        role: 'admin',
      });
      expect(created.clerkUserId).toBe(clerkUserId);
      expect(created.cksCode).toBe(cksCode.toLowerCase());

      const fetched = await getAdminUserById(clerkUserId);
      expect(fetched?.email).toBe(email.toLowerCase());
    } finally {
      await removeAdminUser(clerkUserId);
    }
  });
});
