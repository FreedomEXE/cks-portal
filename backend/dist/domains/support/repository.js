"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTickets = listTickets;
exports.createTicket = createTicket;
exports.updateTicketStatus = updateTicketStatus;
const connection_1 = __importDefault(require("../../db/connection"));
async function listTickets(query) {
    const where = [];
    const vals = [];
    if (query.status) {
        vals.push(query.status);
        where.push(`status = $${vals.length}`);
    }
    if (query.priority) {
        vals.push(query.priority);
        where.push(`priority = $${vals.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(query.limit || 25, 1), 200);
    const offset = Math.max(((query.page || 1) - 1) * limit, 0);
    const sql = `
    SELECT ticket_id, subject, description, status, priority, created_by, assigned_to, created_at, updated_at
    FROM support_tickets
    ${whereSql}
    ORDER BY updated_at DESC NULLS LAST, ticket_id DESC
    LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}
  `;
    const res = await connection_1.default.query(sql, [...vals, limit, offset]);
    return res.rows;
}
async function createTicket(input) {
    const res = await connection_1.default.query(`INSERT INTO support_tickets (subject, description, status, priority, created_by)
     VALUES ($1, $2, 'open', $3, $4)
     RETURNING ticket_id, subject, description, status, priority, created_by, assigned_to, created_at, updated_at`, [input.subject, input.description || null, input.priority, input.created_by]);
    return res.rows[0];
}
async function updateTicketStatus(ticketId, status) {
    const res = await connection_1.default.query(`UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE ticket_id = $2
     RETURNING ticket_id, subject, description, status, priority, created_by, assigned_to, created_at, updated_at`, [status, ticketId]);
    return res.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map