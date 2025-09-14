"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoleFastify = requireRoleFastify;
function requireRoleFastify(expectedRole) {
    return async (req, reply) => {
        const role = (req.params?.role || req.roleContext?.role || '').toLowerCase();
        if (role !== expectedRole.toLowerCase()) {
            return reply.code(403).send({
                success: false,
                error: {
                    code: 'CONTEXT_ROLE_FORBIDDEN',
                    message: `Role ${role || 'unknown'} not allowed for this endpoint`,
                    details: { expected: expectedRole },
                    timestamp: new Date().toISOString(),
                },
            });
        }
    };
}
//# sourceMappingURL=roleGuard.js.map