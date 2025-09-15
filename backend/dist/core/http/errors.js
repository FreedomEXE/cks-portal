"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.badRequest = badRequest;
exports.notFound = notFound;
exports.forbidden = forbidden;
exports.internal = internal;
function badRequest(message, details) {
    return { ok: false, error: { code: "BAD_REQUEST", message, details } };
}
function notFound(message, details) {
    return { ok: false, error: { code: "NOT_FOUND", message, details } };
}
function forbidden(message, details) {
    return { ok: false, error: { code: "FORBIDDEN", message, details } };
}
function internal(message = "Internal server error", details) {
    return { ok: false, error: { code: "INTERNAL", message, details } };
}
//# sourceMappingURL=errors.js.map