"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCapsFastify = requireCapsFastify;
function requireCapsFastify(required) {
    const requiredList = Array.isArray(required) ? required : [required];
    return async (req, reply) => {
        const caps = req.user?.capabilities || [];
        const missing = requiredList.filter((r) => !caps.includes(r));
        if (missing.length > 0) {
            return reply.code(403).send({
                success: false,
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Insufficient permissions',
                    details: { missing },
                    timestamp: new Date().toISOString(),
                },
            });
        }
    };
}
//# sourceMappingURL=requireCaps.js.map