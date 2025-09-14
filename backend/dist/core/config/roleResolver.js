"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRole = resolveRole;
exports.getRoleConfig = getRoleConfig;
exports.hasDomain = hasDomain;
exports.resolveDomainConfig = resolveDomainConfig;
exports.getDomainCapabilities = getDomainCapabilities;
exports.getDomainFeatures = getDomainFeatures;
exports.requireDomainConfig = requireDomainConfig;
exports.listDomains = listDomains;
exports.getRoleScope = getRoleScope;
const config_1 = require("../../roles/admin/config");
const config_2 = require("../../roles/manager/config");
const config_3 = require("../../roles/warehouse/config");
const DOMAIN_ALIASES = {
    assignments: ['assign'],
};
function normalizeDomainName(name) {
    const n = String(name || '').toLowerCase();
    if (!n)
        return n;
    for (const canonical of Object.keys(DOMAIN_ALIASES)) {
        const aliases = DOMAIN_ALIASES[canonical];
        if (n === canonical || aliases.includes(n))
            return canonical;
    }
    return n;
}
function resolveRole(roleParam) {
    const r = String(roleParam || '').toLowerCase();
    const valid = ['admin', 'manager', 'warehouse', 'contractor', 'customer', 'center', 'crew'];
    return valid.includes(r) ? r : null;
}
function getRoleConfigInternal(role) {
    switch (role) {
        case 'admin':
            return config_1.AdminConfig;
        case 'manager':
            return config_2.ManagerConfig;
        case 'warehouse':
            return config_3.WarehouseConfig;
        // Roles not yet implemented in this repo
        case 'contractor':
        case 'customer':
        case 'center':
        case 'crew':
        default:
            return null;
    }
}
function getRoleConfig(role) {
    return getRoleConfigInternal(role);
}
function hasDomain(role, domain) {
    const rc = getRoleConfigInternal(role);
    if (!rc)
        return false;
    const dn = normalizeDomainName(domain);
    return !!rc.domains && dn in rc.domains && !!rc.domains[dn];
}
function resolveDomainConfig(role, domain) {
    const rc = getRoleConfigInternal(role);
    if (!rc)
        return null;
    const dn = normalizeDomainName(domain);
    const cfg = rc.domains?.[dn];
    if (!cfg)
        return null;
    // Shallow clone + ensure roleCode present
    return { ...cfg, roleCode: role };
}
function getDomainCapabilities(role, domain) {
    const cfg = resolveDomainConfig(role, domain);
    return cfg?.capabilities || {};
}
function getDomainFeatures(role, domain) {
    const cfg = resolveDomainConfig(role, domain);
    return cfg?.features || {};
}
function requireDomainConfig(role, domain) {
    const cfg = resolveDomainConfig(role, domain);
    if (!cfg) {
        const dn = normalizeDomainName(domain);
        throw new Error(`Domain config not found for role=${role} domain=${dn}`);
    }
    return cfg;
}
function listDomains(role) {
    const rc = getRoleConfigInternal(role);
    if (!rc?.domains)
        return [];
    return Object.keys(rc.domains).filter((k) => !!rc.domains[k]);
}
function getRoleScope(role) {
    const rc = getRoleConfigInternal(role);
    return rc?.role?.scope;
}
//# sourceMappingURL=roleResolver.js.map