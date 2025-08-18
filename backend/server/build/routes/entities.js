"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../db/pool"));
const http_1 = require("../utils/http");
const router = express_1.default.Router();
router.get('/crew/:id', (0, http_1.safe)(async (req, res) => {
    const { rows } = await pool_1.default.query(`SELECT crew_id, name, status, role, address, phone, email, assigned_center 
     FROM crew WHERE crew_id = $1`, [req.params.id]);
    if (!rows.length)
        return (0, http_1.bad)(res, 'Not found', 404);
    (0, http_1.ok)(res, rows[0]);
}));
router.get('/contractors/:id', (0, http_1.safe)(async (req, res) => {
    const { rows } = await pool_1.default.query(`SELECT contractor_id, cks_manager, company_name, num_customers, main_contact, address, phone, email
     FROM contractors WHERE contractor_id = $1`, [req.params.id]);
    if (!rows.length)
        return (0, http_1.bad)(res, 'Not found', 404);
    (0, http_1.ok)(res, rows[0]);
}));
router.get('/customers/:id', (0, http_1.safe)(async (req, res) => {
    const { rows } = await pool_1.default.query(`SELECT customer_id, cks_manager, company_name, num_centers, main_contact, address, phone, email
     FROM customers WHERE customer_id = $1`, [req.params.id]);
    if (!rows.length)
        return (0, http_1.bad)(res, 'Not found', 404);
    (0, http_1.ok)(res, rows[0]);
}));
router.get('/centers/:id', (0, http_1.safe)(async (req, res) => {
    const { rows } = await pool_1.default.query(`SELECT center_id, cks_manager, name, main_contact, address, phone, email, contractor_id, customer_id
     FROM centers WHERE center_id = $1`, [req.params.id]);
    if (!rows.length)
        return (0, http_1.bad)(res, 'Not found', 404);
    (0, http_1.ok)(res, rows[0]);
}));
exports.default = router;
