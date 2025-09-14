"use strict";
/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRouters = void 0;
exports.getRoleRouter = getRoleRouter;
exports.getAvailableRoles = getAvailableRoles;
exports.isValidRole = isValidRole;
// Import role routers
const router_1 = __importDefault(require("../roles/admin/router"));
const router_2 = __importDefault(require("../roles/manager/router"));
// Import other role routers as they're implemented
// import contractorRouter from '../roles/contractor/router';
// import customerRouter from '../roles/customer/router';
// import centerRouter from '../roles/center/router';
// import crewRouter from '../roles/crew/router';
// import warehouseRouter from '../roles/warehouse/router';
/**
 * Role router registry
 * Maps role codes to their configured routers
 */
exports.RoleRouters = {
    admin: router_1.default,
    manager: router_2.default,
    // contractor: contractorRouter,
    // customer: customerRouter,
    // center: centerRouter,
    // crew: crewRouter,
    // warehouse: warehouseRouter
};
/**
 * Get router for specific role
 */
function getRoleRouter(roleCode) {
    const normalizedRole = roleCode.toLowerCase();
    return exports.RoleRouters[normalizedRole] || null;
}
/**
 * Get list of available roles
 */
function getAvailableRoles() {
    return Object.keys(exports.RoleRouters);
}
/**
 * Validate if role exists
 */
function isValidRole(roleCode) {
    return getAvailableRoles().includes(roleCode.toLowerCase());
}
//# sourceMappingURL=index.js.map