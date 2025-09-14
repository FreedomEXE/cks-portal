import { AssignmentEntity, AssignmentsQuery, AssignmentStatus } from './types';
export declare function listAssignments(query: AssignmentsQuery): Promise<AssignmentEntity[]>;
export declare function createAssignment(input: Pick<AssignmentEntity, 'type' | 'subject' | 'assignee_id' | 'priority'>): Promise<AssignmentEntity>;
export declare function updateAssignmentStatus(assignmentId: number, status: AssignmentStatus): Promise<AssignmentEntity | null>;
//# sourceMappingURL=repository.d.ts.map