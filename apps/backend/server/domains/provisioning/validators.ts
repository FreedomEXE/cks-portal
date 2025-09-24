import { z } from 'zod';
const optionalString = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .optional()
  .transform((value) => (value ? value : undefined));

function requiredString(field: string, max = 255) {
  return z.string().trim().min(1, `${field} is required`).max(max);
}

const managerRoleSchema = z.enum(['Strategic Manager', 'Operations Manager', 'Field Manager', 'Development Manager']);
const reportsToSchema = z.enum(['CEO', 'strategic-manager', 'operations-manager']);

const managerReportsToMap: Record<z.infer<typeof managerRoleSchema>, Array<z.infer<typeof reportsToSchema>>> = {
  'Strategic Manager': ['CEO'],
  'Operations Manager': ['CEO', 'strategic-manager'],
  'Field Manager': ['CEO', 'strategic-manager', 'operations-manager'],
  'Development Manager': ['CEO', 'strategic-manager'],
};

const requiredEmail = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Provide a valid email address')
  .max(255);

const requiredPhone = z.string().trim().min(1, 'Phone number is required').max(50);

export const managerCreateSchema = z
  .object({
    fullName: requiredString('Manager name'),
    territory: requiredString('Territory'),
    phone: requiredPhone,
    email: requiredEmail,
    role: managerRoleSchema,
    reportsTo: reportsToSchema.optional(),
    address: requiredString('Address'),
  })
  .superRefine((data, ctx) => {
    const allowed = managerReportsToMap[data.role];
    if (data.reportsTo && !allowed.includes(data.reportsTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reportsTo'],
        message: 'Invalid reports to selection for the chosen role',
      });
    }
  });

export const contractorCreateSchema = z.object({
  name: requiredString('Contractor name'),
  mainContact: requiredString('Main contact'),
  email: requiredEmail,
  phone: requiredPhone,
  address: requiredString('Address'),
});

export const customerCreateSchema = z.object({
  name: requiredString('Customer name'),
  mainContact: requiredString('Main contact'),
  email: requiredEmail,
  phone: requiredPhone,
  address: requiredString('Address'),
});

export const centerCreateSchema = z.object({
  name: requiredString('Center name'),
  mainContact: requiredString('Main contact'),
  email: requiredEmail,
  phone: requiredPhone,
  address: requiredString('Address'),
});

export const crewCreateSchema = z.object({
  name: requiredString('Crew name'),
  emergencyContact: requiredString('Emergency contact'),
  email: requiredEmail,
  phone: requiredPhone,
  address: requiredString('Address'),
});

export const warehouseCreateSchema = z.object({
  name: requiredString('Warehouse name'),
  mainContact: requiredString('Main contact'),
  email: requiredEmail,
  phone: requiredPhone,
  address: requiredString('Address'),
  managerId: optionalString,
  warehouseType: optionalString,
});

export type ManagerCreateInput = z.infer<typeof managerCreateSchema>;
export type ContractorCreateInput = z.infer<typeof contractorCreateSchema>;
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CenterCreateInput = z.infer<typeof centerCreateSchema>;
export type CrewCreateInput = z.infer<typeof crewCreateSchema>;
export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;
