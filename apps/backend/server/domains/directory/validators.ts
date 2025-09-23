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
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
  archivedAt: isoDateString,
});

export const contractorDirectoryEntrySchema = z.object({
  id: z.string(),
  companyName: nullableString,
  managerId: nullableString,
  contactPerson: nullableString,
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
  contactName: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  totalCenters: nullableNumber,
  archivedAt: isoDateString,
});

export const centerDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  managerId: nullableString,
  contractorId: nullableString,
  customerId: nullableString,
  contactName: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  archivedAt: isoDateString,
});

export const crewDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  status: nullableString,
  role: nullableString,
  email: nullableString,
  phone: nullableString,
  address: nullableString,
  assignedCenter: nullableString,
  archivedAt: isoDateString,
});

export const warehouseDirectoryEntrySchema = z.object({
  id: z.string(),
  name: nullableString,
  managerId: nullableString,
  managerName: nullableString,
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
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const orderDirectoryEntrySchema = z.object({
  id: z.string(),
  customerId: z.string(),
  centerId: nullableString,
  serviceId: nullableString,
  orderDate: isoDateString,
  completionDate: isoDateString,
  totalAmount: nullableString,
  status: nullableString,
  notes: nullableString,
  assignedWarehouse: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const productDirectoryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: nullableString,
  description: nullableString,
  price: nullableString,
  unit: nullableString,
  status: nullableString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const trainingDirectoryEntrySchema = z.object({
  id: z.string(),
  crewId: nullableString,
  crewName: nullableString,
  serviceId: nullableString,
  serviceName: nullableString,
  date: isoDateString,
  expense: nullableString,
  days: nullableNumber,
  status: nullableString,
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
