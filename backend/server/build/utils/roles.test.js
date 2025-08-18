"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const roles_1 = require("./roles");
describe('roleFromInternalCode', () => {
    it('maps admin', () => {
        expect((0, roles_1.roleFromInternalCode)('000-A')).toBe('admin');
    });
    it('maps crew', () => {
        expect((0, roles_1.roleFromInternalCode)('A123-A')).toBe('crew');
    });
    it('maps contractor', () => {
        expect((0, roles_1.roleFromInternalCode)('B1')).toBe('contractor');
    });
    it('maps customer', () => {
        expect((0, roles_1.roleFromInternalCode)('C9')).toBe('customer');
    });
    it('returns null for unknown', () => {
        expect((0, roles_1.roleFromInternalCode)('ZZZ')).toBeNull();
    });
});
