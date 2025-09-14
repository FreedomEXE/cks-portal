"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAuthPlugin = void 0;
// Opt-in mock auth for development: set DEV_MOCK_AUTH=1
const mockAuthPlugin = (app, _opts, done) => {
    app.addHook('preHandler', async (req, reply) => {
        if (process.env.DEV_MOCK_AUTH !== '1')
            return;
        if (req.user)
            return; // already authenticated
        const userId = req.headers['x-mock-user'] || 'MGR-001';
        const roleCode = req.headers['x-mock-role'] || 'manager';
        const caps = req.headers['x-mock-caps']?.split(',').map(s => s.trim()).filter(Boolean) || [
            'dashboard:view', 'profile:view', 'profile:update', 'directory:view', 'catalog:view'
        ];
        req.user = { userId, roleCode, capabilities: caps, sessionId: 'mock-session' };
        req.roleContext = { role: roleCode };
    });
    done();
};
exports.mockAuthPlugin = mockAuthPlugin;
//# sourceMappingURL=mockAuth.js.map