"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAssignments = listAssignments;
exports.createAssignment = createAssignment;
exports.updateAssignmentStatus = updateAssignmentStatus;
const connection_1 = __importDefault(require("../../db/connection"));
async function listAssignments(query) {
    const where = [];
    const vals = [];
    if (query.status) {
        vals.push(query.status);
        where.push(`status = $${vals.length}`);
    }
    if (query.assignee_id) {
        vals.push(query.assignee_id);
        where.push(`assignee_id = $${vals.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = Math.min(Math.max(query.limit || 25, 1), 200);
    const offset = Math.max(((query.page || 1) - 1) * limit, 0);
    const res = await connection_1.default.query(`SELECT assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at
     FROM assignments
     ${whereSql}
     ORDER BY updated_at DESC NULLS LAST, assignment_id DESC
     LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`, [...vals, limit, offset]);
    return res.rows;
}
async function createAssignment(input) {
    const res = await connection_1.default.query(`INSERT INTO assignments (type, subject, assignee_id, status, priority)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at`, [input.type, input.subject, input.assignee_id, input.priority]);
    return res.rows[0];
}
async function updateAssignmentStatus(assignmentId, status) {
    const res = await connection_1.default.query(`UPDATE assignments SET status = $1, updated_at = NOW() WHERE assignment_id = $2
     RETURNING assignment_id, type, subject, assignee_id, status, priority, created_at, updated_at`, [status, assignmentId]);
    return res.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map