"use strict";
/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOrThrow = parseOrThrow;
function parseOrThrow(schema, input) {
    const res = schema.safeParse(input);
    if (!res.success) {
        const details = res.error.issues.map((i) => ({ path: i.path.join("."), code: i.code, message: i.message }));
        const err = new Error("Validation failed");
        err.details = details;
        throw err;
    }
    return res.data;
}
//# sourceMappingURL=zod.js.map