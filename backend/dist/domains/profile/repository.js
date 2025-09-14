"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = getUserProfile;
exports.updateUserProfile = updateUserProfile;
const connection_1 = __importDefault(require("../../db/connection"));
async function getUserProfile(userId) {
    const result = await connection_1.default.query(`SELECT user_id, user_name, email, role_code, template_version, created_at, archived
     FROM users
     WHERE user_id = $1`, [userId.toUpperCase()]);
    return result.rows?.[0] || null;
}
async function updateUserProfile(userId, updates) {
    const sets = [];
    const vals = [];
    if (updates.user_name !== undefined) {
        vals.push(updates.user_name);
        sets.push(`user_name = $${vals.length}`);
    }
    if (updates.email !== undefined) {
        vals.push(updates.email);
        sets.push(`email = $${vals.length}`);
    }
    if (updates.template_version !== undefined) {
        vals.push(updates.template_version);
        sets.push(`template_version = $${vals.length}`);
    }
    if (!sets.length) {
        return await getUserProfile(userId);
    }
    vals.push(userId.toUpperCase());
    const query = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = $${vals.length} RETURNING user_id, user_name, email, role_code, template_version, created_at, archived`;
    const result = await connection_1.default.query(query, vals);
    return result.rows?.[0] || null;
}
//# sourceMappingURL=repository.js.map