import { AssignmentEntity, AssignmentsQuery, AssignmentStatus } from './types';
import * as repo from './repository';

export async function list(query: AssignmentsQuery): Promise<AssignmentEntity[]> {
  const q: AssignmentsQuery = {
    limit: Math.min(Math.max(query.limit || 25, 1), 200),
    page: Math.max(query.page || 1, 1),
    status: query.status,
    assignee_id: query.assignee_id,
  };
  return await repo.listAssignments(q);
}

export async function create(type: string, subject: string, assignee_id: string, priority: 'low'|'medium'|'high'|'urgent'): Promise<AssignmentEntity> {
  return await repo.createAssignment({ type, subject, assignee_id, priority });
}

export async function updateStatus(assignmentId: number, status: AssignmentStatus): Promise<AssignmentEntity | null> {
  return await repo.updateAssignmentStatus(assignmentId, status);
}

