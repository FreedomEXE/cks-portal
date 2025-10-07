import z from 'zod';
import type { DirectoryResourceKey, DirectoryResourceMap } from './types';

const nullableString = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value == null ? null : value));

const isoDateString = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value == null ? null : value));

const nullableNumber = z
  .number()
  .optional()
  .nullable()
  .transform((value) => (value == null ? null : value));

const nullableBoolean = z
  .boolean()
  .optional()
  .nullable()
  .transform((value) => (value == null ? null : value));

const nullableDate = z
  .date()
  .optional()
  .nullable()
  .transform((value) => (value == null ? null : value));

export const managerDirectoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: nullableString,
  phone: nullableString,
  territory: nullableString,
  role: nullableString,
  reportsTo: nullableString,
  address: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const contractorDirectoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  managerId: nullableString,
  mainContact: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const customerDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  managerId: nullableString,
  mainContact: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  status: nullableString,
  totalCenters: nullableNumber,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const centerDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  managerId: nullableString,
  contractorId: nullableString,
  customerId: nullableString,
  mainContact: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const crewDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  status: nullableString,
  emergencyContact: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  assignedCenter: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const warehouseDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  managerId: nullableString,
  managerName: nullableString,
  mainContact: nullableString,
  warehouseType: nullableString,
  address: nullableString,
  email: nullableString,
  phone: nullableString,
  capacity: nullableNumber,
  utilization: nullableNumber,
  status: nullableString,
  dateAcquired: isoDateString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const serviceDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  category: nullableString,
  description: nullableString,
  pricingModel: nullableString,
  requirements: nullableString,
  managedBy: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const orderDirectoryEntrySchema = z.object({
  id: z.string(),
  customerId: nullableString,
  centerId: nullableString,
  serviceId: nullableString,
  orderDate: isoDateString,
  completionDate: isoDateString,
  totalAmount: nullableNumber,
  status: nullableString,
  notes: nullableString,
  assignedWarehouse: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  // Extra fields surfaced by backend for better display
  createdBy: nullableString,
  createdByRole: nullableString,
  // Optional fields provided by store for richer Admin view
  destination: nullableString,
  destinationRole: nullableString,
  orderType: nullableString,
  items: z
    .array(
      z.object({
        id: z.string(),
        code: nullableString,
        name: z.string(),
        description: nullableString,
        itemType: z.string(),
        quantity: z.number().or(z.coerce.number()),
        unitOfMeasure: nullableString,
        unitPrice: nullableString,
        currency: nullableString,
        totalPrice: nullableString,
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .nullable()
          .transform((value) => (value == null ? null : value)),
      }),
    )
    .optional(),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable()
    .transform((value) => (value == null ? null : value)),
});

export const productDirectoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: nullableString,
  description: nullableString,
  price: nullableNumber,
  unit: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  rawId: nullableString,
  source: z.enum(['products', 'catalog']).optional(),
});

export const trainingDirectoryEntrySchema = z.object({
  id: z.string(),
  crewId: nullableString,
  crewName: nullableString,
  serviceId: nullableString,
  serviceName: nullableString,
  date: isoDateString,
  expense: nullableNumber,
  days: nullableNumber,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const procedureDirectoryEntrySchema = z.object({
  id: z.string(),
  serviceId: nullableString,
  type: nullableString,
  contractorId: nullableString,
  customerId: nullableString,
  centerId: nullableString,
});

export const reportDirectoryEntrySchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: nullableString,
  title: z.string(),
  description: nullableString,
  centerId: nullableString,
  customerId: nullableString,
  status: z.string(),
  createdByRole: z.string(),
  createdById: z.string(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const feedbackDirectoryEntrySchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  message: nullableString,
  centerId: nullableString,
  customerId: nullableString,
  createdByRole: z.string(),
  createdById: z.string(),
  createdAt: isoDateString,
  archivedAt: isoDateString,
});

export const activityEntrySchema = z.object({
  id: z.string(),
  description: z.string(),
  category: z.string(),
  actorId: nullableString,
  actorRole: nullableString,
  targetId: nullableString,
  targetType: nullableString,
  metadata: z.record(z.string(), z.unknown()).optional().nullable().transform((value) => (value == null ? null : value)),
  createdAt: z.string(),
});

export const directoryResourceSchemas = {
  managers: managerDirectoryEntrySchema,
  contractors: contractorDirectoryEntrySchema,
  customers: customerDirectoryEntrySchema,
  centers: centerDirectoryEntrySchema,
  crew: crewDirectoryEntrySchema,
  warehouses: warehouseDirectoryEntrySchema,
  services: serviceDirectoryEntrySchema,
  orders: orderDirectoryEntrySchema,
  products: productDirectoryEntrySchema,
  training: trainingDirectoryEntrySchema,
  procedures: procedureDirectoryEntrySchema,
  reports: reportDirectoryEntrySchema,
  feedback: feedbackDirectoryEntrySchema,
  activities: activityEntrySchema,
} as const satisfies { [K in DirectoryResourceKey]: z.ZodType<DirectoryResourceMap[K]> };

export type DirectoryResourceSchemaMap = typeof directoryResourceSchemas;

