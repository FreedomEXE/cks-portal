export type AssignmentStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export interface AssignmentEntity {
    assignment_id: number;
    type?: string | null;
    subject?: string | null;
    assignee_id?: string | null;
    status: AssignmentStatus;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    created_at?: string | Date;
    updated_at?: string | Date;
}
export interface AssignmentsQuery {
    status?: AssignmentStatus;
    assignee_id?: string;
    limit?: number;
    page?: number;
}
export interface AssignmentsRouteConfig {
    capabilities: {
        view: string;
        create?: string;
        update?: string;
    };
    features: {
        listing: boolean;
        details?: boolean;
        statusTracking?: boolean;
    };
    scope: 'global' | 'ecosystem' | 'entity';
    roleCode: string;
}
//# sourceMappingURL=types.d.ts.map