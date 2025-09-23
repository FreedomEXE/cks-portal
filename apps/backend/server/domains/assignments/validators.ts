import z from 'zod';

const idSchema = z.string().trim().min(1, 'ID is required').max(64);

export const contractorAssignmentSchema = z.object({
  managerId: idSchema,
});

export const customerAssignmentSchema = z.object({
  contractorId: idSchema,
});

export const centerAssignmentSchema = z.object({
  customerId: idSchema,
});

export const crewAssignmentSchema = z.object({
  centerId: idSchema,
});

export type ContractorAssignmentInput = z.infer<typeof contractorAssignmentSchema>;
export type CustomerAssignmentInput = z.infer<typeof customerAssignmentSchema>;
export type CenterAssignmentInput = z.infer<typeof centerAssignmentSchema>;
export type CrewAssignmentInput = z.infer<typeof crewAssignmentSchema>;
