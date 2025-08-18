const express = require('express');
const pool = require('../db/pool');
const { ok, bad, safe } = require('../utils/http');

const router = express.Router();

router.get('/crew/:id', safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT crew_id, name, status, role, address, phone, email, assigned_center 
     FROM crew WHERE crew_id = $1`,
    [req.params.id]
  );
  if (!rows.length) return bad(res, 'Not found', 404);
  ok(res, rows[0]);
}));

router.get('/contractors/:id', safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT contractor_id, cks_manager, company_name, num_customers, main_contact, address, phone, email
     FROM contractors WHERE contractor_id = $1`,
    [req.params.id]
  );
  if (!rows.length) return bad(res, 'Not found', 404);
  ok(res, rows[0]);
}));

router.get('/customers/:id', safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT customer_id, cks_manager, company_name, num_centers, main_contact, address, phone, email
     FROM customers WHERE customer_id = $1`,
    [req.params.id]
  );
  if (!rows.length) return bad(res, 'Not found', 404);
  ok(res, rows[0]);
}));

router.get('/centers/:id', safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
     FROM centers WHERE center_id = $1`,
    [req.params.id]
  );
  if (!rows.length) return bad(res, 'Not found', 404);
  ok(res, rows[0]);
}));

module.exports = router;
