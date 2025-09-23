import z from 'zod';

const optionalString = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .optional()
  .transform((value) => (value ? value : undefined));

const managerRoleSchema = z.enum(['Strategic Manager', 'Operations Manager', 'Field Manager', 'Development Manager']);
const reportsToSchema = z.enum(['CEO', 'strategic-manager', 'operations-manager']);

const managerReportsToMap: Record<z.infer<typeof managerRoleSchema>, Array<z.infer<typeof reportsToSchema>>> = {
  'Strategic Manager': ['CEO'],
  'Operations Manager': ['CEO', 'strategic-manager'],
  'Field Manager': ['CEO', 'strategic-manager', 'operations-manager'],
  'Development Manager': ['CEO', 'strategic-manager'],
};

export const managerCreateSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Manager name is required').max(255),
    territory: z.string().trim().min(1, 'Territory is required').max(255),
    phone: z.string().trim().min(1, 'Phone number is required').max(50),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Provide a valid email address')
      .max(255),
    role: managerRoleSchema,
    reportsTo: reportsToSchema,
    address: z.string().trim().min(1, 'Address is required').max(255),
    status: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional()
      .default('active'),
  })
  .superRefine((data, ctx) => {
    const allowed = managerReportsToMap[data.role];
    if (!allowed.includes(data.reportsTo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reportsTo'],
        message: 'Invalid reports to selection for the chosen role',
      });
    }
  });

export const contractorCreateSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(255),
  contactPerson: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
  status: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .default('active'),
});

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required').max(255),
  contactName: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
  status: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .default('active'),
});

export const centerCreateSchema = z.object({
  name: z.string().trim().min(1, 'Center name is required').max(255),
  contactName: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
  status: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .default('active'),
});

export const crewCreateSchema = z.object({
  name: z.string().trim().min(1, 'Crew name is required').max(255),
  role: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
  status: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .default('active'),
});

export const warehouseCreateSchema = z.object({
  name: z.string().trim().min(1, 'Warehouse name is required').max(255),
  managerId: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
  warehouseType: optionalString,
  status: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .default('active'),
});

export type ManagerCreateInput = z.infer<typeof managerCreateSchema>;
export type ContractorCreateInput = z.infer<typeof contractorCreateSchema>;
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;
export type CenterCreateInput = z.infer<typeof centerCreateSchema>;
export type CrewCreateInput = z.infer<typeof crewCreateSchema>;
export type WarehouseCreateInput = z.infer<typeof warehouseCreateSchema>;

