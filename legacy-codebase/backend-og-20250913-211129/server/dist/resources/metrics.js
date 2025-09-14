"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
const logger_1 = require("../src/core/logger");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const usersQuery = `
      SELECT 
        (SELECT COUNT(*) FROM managers) +
        (SELECT COUNT(*) FROM contractors) +
        (SELECT COUNT(*) FROM customers) +
        (SELECT COUNT(*) FROM centers) +
        (SELECT COUNT(*) FROM crew) as total_users
    `;
        const supportQuery = `
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_tickets,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as tickets_today
      FROM support_tickets
    `;
        const activityQuery = `
      SELECT 
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as activities_today,
        COUNT(CASE WHEN activity_type = 'user_created' THEN 1 END) as users_created_total
      FROM system_activity
    `;
        const daysOnlineQuery = `
      SELECT 
        COALESCE(
          GREATEST(
            DATE_PART('day', NOW() - (SELECT MIN(created_at) FROM system_activity WHERE activity_type = 'user_created')),
            DATE_PART('day', NOW() - (SELECT MIN(start_date::timestamp) FROM managers WHERE start_date IS NOT NULL)),
            0
          ), 
          0
        ) as days_online
    `;
        const [usersResult, supportResult, activityResult, daysResult] = await Promise.all([
            pool_1.default.query(usersQuery).catch(() => ({ rows: [{ total_users: 0 }] })),
            pool_1.default.query(supportQuery).catch(() => ({ rows: [{ total_tickets: 0, open_tickets: 0, investigating_tickets: 0, high_priority_tickets: 0, tickets_today: 0 }] })),
            pool_1.default.query(activityQuery).catch(() => ({ rows: [{ activities_today: 0, users_created_total: 0 }] })),
            pool_1.default.query(daysOnlineQuery).catch(() => ({ rows: [{ days_online: 0 }] }))
        ]);
        const metrics = {
            users: {
                total: Number(usersResult.rows[0]?.total_users || 0),
                created_today: Number(activityResult.rows[0]?.users_created_total || 0)
            },
            support_tickets: {
                total: Number(supportResult.rows[0]?.total_tickets || 0),
                open: Number(supportResult.rows[0]?.open_tickets || 0),
                investigating: Number(supportResult.rows[0]?.investigating_tickets || 0),
                high_priority: Number(supportResult.rows[0]?.high_priority_tickets || 0),
                today: Number(supportResult.rows[0]?.tickets_today || 0),
                unread: Number(supportResult.rows[0]?.open_tickets || 0) + Number(supportResult.rows[0]?.investigating_tickets || 0)
            },
            system: {
                days_online: Math.max(0, Math.floor(Number(daysResult.rows[0]?.days_online || 0))),
                activities_today: Number(activityResult.rows[0]?.activities_today || 0)
            }
        };
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        logger_1.logger.error({ error }, 'Failed to fetch admin metrics');
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics',
            data: {
                users: { total: 0, created_today: 0 },
                support_tickets: { total: 0, open: 0, investigating: 0, high_priority: 0, today: 0, unread: 0 },
                system: { days_online: 0, activities_today: 0 }
            }
        });
    }
});
exports.default = router;
//# sourceMappingURL=metrics.js.map