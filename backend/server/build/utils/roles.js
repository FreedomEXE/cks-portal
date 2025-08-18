"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleFromInternalCode = roleFromInternalCode;
function roleFromInternalCode(code = '') {
    if (code === '000-A')
        return 'admin';
    if (/-A$|^A/.test(code))
        return 'crew';
    if (/-B$|^B/.test(code))
        return 'contractor';
    if (/-C$|^C/.test(code))
        return 'customer';
    if (/-D$|^D/.test(code))
        return 'center';
    return null;
}
