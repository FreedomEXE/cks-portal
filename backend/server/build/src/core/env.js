"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().regex(/^\d+$/).default('5000'),
    DATABASE_URL: zod_1.z.string().url().optional(),
    DB_HOST: zod_1.z.string().optional(),
    DB_PORT: zod_1.z.string().optional(),
    DB_NAME: zod_1.z.string().optional(),
    DB_USER: zod_1.z.string().optional(),
    DB_PASSWORD: zod_1.z.string().optional(),
    PG_SSL: zod_1.z.string().optional()
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
