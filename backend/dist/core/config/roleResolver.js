"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePrefixes = void 0;
exports.isValidRole = isValidRole;
exports.getPrefix = getPrefix;
exports.rolePrefixes = {
    admin: "/api/admin",
    manager: "/api/manager",
    customer: "/api/customer",
    contractor: "/api/contractor",
    center: "/api/center",
    crew: "/api/crew",
    warehouse: "/api/warehouse",
};
function isValidRole(role) {
    return Object.keys(exports.rolePrefixes).includes(role);
}
function getPrefix(role) {
    return isValidRole(role) ? exports.rolePrefixes[role] : null;
}
//# sourceMappingURL=roleResolver.js.map