import { AssignmentEntity, AssignmentsQuery, AssignmentStatus } from './types';
export declare function list(query: AssignmentsQuery): Promise<AssignmentEntity[]>;
export declare function create(type: string, subject: string, assignee_id: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<AssignmentEntity>;
export declare function updateStatus(assignmentId: number, status: AssignmentStatus): Promise<AssignmentEntity | null>;
//# sourceMappingURL=service.d.ts.map