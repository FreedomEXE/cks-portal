import { z } from 'zod';

const statusEnum = z.enum(['active', 'suspended', 'archived']);
const roleEnum = z.enum(['admin']);
const optionalTrimmedString = z.string().trim().min(1).optional();

export const createAdminUserSchema = z.object({
  clerkUserId: z.string().trim().min(1, 'clerkUserId is required'),
  cksCode: z.string().trim().min(1, 'cksCode is required'),
  role: roleEnum.default('admin'),
  status: statusEnum.default('active'),
  fullName: optionalTrimmedString.nullable(),
  email: z.string().email().optional(),
  territory: optionalTrimmedString.nullable(),
  phone: optionalTrimmedString.nullable(),
  address: optionalTrimmedString.nullable(),
  reportsTo: optionalTrimmedString.nullable(),
});

export const updateAdminUserSchema = createAdminUserSchema
  .partial()
  .extend({
    clerkUserId: z.string().trim().min(1, 'clerkUserId is required'),
    archivedAt: z.string().datetime().nullable().optional(),
  })
  .refine((value) => {
    const keys = Object.keys(value).filter((key) => key !== 'clerkUserId');
    return keys.length > 0;
  }, { message: 'At least one property must be provided to update.' });

export const queryOptionsSchema = z.object({
  filter: z
    .object({
      status: statusEnum.optional(),
      territory: optionalTrimmedString,
      role: roleEnum.optional(),
    })
    .partial()
    .optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserInput = z.infer<typeof updateAdminUserSchema>;
export type QueryOptionsInput = z.infer<typeof queryOptionsSchema>;
