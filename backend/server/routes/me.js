const express = require('express');
const pool = require('../db/pool');
const { ok, bad, safe } = require('../utils/http');
const { roleFromInternalCode } = require('../utils/roles');

const router = express.Router();

// Simple auth passthrough: Clerk user id is expected in header "x-user-id"
function requireUser(req, res, next) {
  const uid = req.header('x-user-id');
  if (!uid) return bad(res, 'Unauthorized', 401);
  req.userId = uid;
  next();
}

router.get('/me/bootstrap', requireUser, safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT clerk_user_id, email, internal_code, role 
     FROM app_users WHERE clerk_user_id = $1`,
    [req.userId]
  );
  if (!rows.length) return ok(res, { linked: false });
  const u = rows[0];
  ok(res, { linked: true, internal_code: u.internal_code, role: u.role });
}));

router.post('/me/link', requireUser, safe(async (req, res) => {
  const { internal_code } = req.body || {};
  if (!internal_code) return bad(res, 'internal_code required');

  // verify code exists in any entity table or is admin 000-A
  let exists = false;
  if (internal_code === '000-A') {
    exists = true;
  } else {
    const checks = [
      { table: 'crew', col: 'crew_id' },
      { table: 'contractors', col: 'contractor_id' },
      { table: 'customers', col: 'customer_id' },
      { table: 'centers', col: 'center_id' },
    ];
    for (const c of checks) {
      const r = await pool.query(`SELECT 1 FROM ${c.table} WHERE ${c.col} = $1 LIMIT 1`, [internal_code]);
      if (r.rowCount > 0) { exists = true; break; }
    }
  }
  if (!exists) return bad(res, 'Unknown internal_code', 404);

  const role = roleFromInternalCode(internal_code);
  if (!role) return bad(res, 'Unable to derive role from internal_code');

  // Upsert app_users
  await pool.query(
    `INSERT INTO app_users (clerk_user_id, email, role, internal_code, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (clerk_user_id) DO UPDATE SET 
        role = EXCLUDED.role, 
        internal_code = EXCLUDED.internal_code, 
        updated_at = NOW()`,
    [req.userId, req.body.email || null, role, internal_code]
  );

  ok(res, { linked: true, internal_code, role });
}));

module.exports = router;
