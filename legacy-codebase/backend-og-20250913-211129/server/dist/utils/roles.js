"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleFromInternalCode = roleFromInternalCode;
exports.isValidCode = isValidCode;
exports.getPrefixForRole = getPrefixForRole;
function roleFromInternalCode(code) {
    if (!code)
        return null;
    const lowerCode = code.toLowerCase();
    if (lowerCode === 'admin-000')
        return 'admin';
    if (lowerCode.startsWith('mgr-'))
        return 'manager';
    if (lowerCode.startsWith('con-'))
        return 'contractor';
    if (lowerCode.startsWith('cust-'))
        return 'customer';
    if (lowerCode.startsWith('ctr-'))
        return 'center';
    if (lowerCode.startsWith('crew-'))
        return 'crew';
    return null;
}
function isValidCode(code, role) {
    const lowerCode = code.toLowerCase();
    switch (role) {
        case 'admin':
            return lowerCode === 'admin-000';
        case 'manager':
            return /^mgr-\d{3}$/i.test(code);
        case 'contractor':
            return /^con-\d{3}$/i.test(code);
        case 'customer':
            return /^cust-\d{3}$/i.test(code);
        case 'center':
            return /^ctr-\d{3}$/i.test(code);
        case 'crew':
            return /^crew-\d{3}$/i.test(code);
        default:
            return false;
    }
}
function getPrefixForRole(role) {
    switch (role) {
        case 'admin':
            return 'admin';
        case 'manager':
            return 'mgr';
        case 'contractor':
            return 'con';
        case 'customer':
            return 'cust';
        case 'center':
            return 'ctr';
        case 'crew':
            return 'crew';
        default:
            return '';
    }
}
//# sourceMappingURL=roles.js.map