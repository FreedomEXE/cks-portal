# Reports & Feedback System - Complete Design Document

## Overview
The CKS Reports & Feedback system is a comprehensive issue tracking and communication platform that facilitates problem resolution and feedback across the ecosystem. It features a dual system of formal Reports (serious issues) and informal Feedback (general communication), with role-based permissions following the organizational hierarchy.

## Core Concepts

### Dual System Structure
1. **Reports** - Serious issues requiring investigation and resolution (safety concerns, performance issues, violations)
2. **Feedback** - General communication and observations (compliments, suggestions, observations)

### Key Principles
- **Hierarchy-Based Creation**: Users can only report about entities below them in the hierarchy
- **Role-Based Visibility**: Different visibility rules based on role and relationships
- **Manager Resolution Authority**: Managers have system-wide oversight and resolution capabilities
- **Complete Audit Trail**: Full tracking from creation to resolution

### Important Update
**Crew can now create reports/feedback, but these are only visible to their direct manager** (not system-wide visibility)

## Database Schema

### Table: `reports`
```sql
CREATE TABLE reports (
  -- Identity
  report_id VARCHAR(10) PRIMARY KEY, -- Format: RPT-XXX
  sequence_number INTEGER NOT NULL,

  -- Core Fields
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'safety', 'performance', 'policy', 'operational'
  severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed', 'dismissed', 'escalated'

  -- Creator Information
  created_by_id VARCHAR(50) NOT NULL,
  created_by_role VARCHAR(20) NOT NULL, -- 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'
  created_by_name VARCHAR(255) NOT NULL,

  -- Subject Information (who/what is being reported)
  about_type VARCHAR(20), -- 'crew', 'customer', 'center', 'contractor', 'operational'
  about_id VARCHAR(50),
  about_name VARCHAR(255),

  -- Special handling for crew reports
  crew_manager_id VARCHAR(50), -- If created by crew, store their manager ID for visibility

  -- Location Context
  location_id VARCHAR(50),
  location_name VARCHAR(255),
  location_details TEXT,

  -- Resolution
  resolved_by_id VARCHAR(50),
  resolved_by_name VARCHAR(255),
  resolved_by_role VARCHAR(20),
  resolution_notes TEXT,
  resolution_action_taken TEXT,

  -- Escalation
  escalated_to_id VARCHAR(50),
  escalated_to_name VARCHAR(255),
  escalated_at TIMESTAMP,
  escalation_reason TEXT,

  -- Attachments
  attachments JSONB DEFAULT '[]', -- Array of attachment URLs/metadata

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,

  -- Metadata
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  is_confidential BOOLEAN DEFAULT false,

  -- Indexes
  INDEX idx_reports_status (status),
  INDEX idx_reports_severity (severity, status),
  INDEX idx_reports_created_by (created_by_id, created_by_role),
  INDEX idx_reports_about (about_type, about_id),
  INDEX idx_reports_created_at (created_at DESC),
  INDEX idx_reports_crew_manager (crew_manager_id), -- For crew report visibility
  UNIQUE INDEX idx_reports_sequence (sequence_number)
);

-- Sequence for report IDs
CREATE SEQUENCE report_sequence START 1;

-- ID generator function
CREATE OR REPLACE FUNCTION gen_report_id()
RETURNS VARCHAR AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  seq_num := nextval('report_sequence');
  RETURN 'RPT-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to set report_id
CREATE TRIGGER set_report_id
  BEFORE INSERT ON reports
  FOR EACH ROW
  WHEN (NEW.report_id IS NULL)
  EXECUTE FUNCTION gen_report_id_trigger();
```

### Table: `feedback`
```sql
CREATE TABLE feedback (
  -- Identity
  feedback_id VARCHAR(10) PRIMARY KEY, -- Format: FDB-XXX
  sequence_number INTEGER NOT NULL,

  -- Core Fields
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  kind VARCHAR(50) NOT NULL, -- 'compliment', 'suggestion', 'observation', 'concern'
  status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'no_action_needed'

  -- Creator Information
  created_by_id VARCHAR(50) NOT NULL,
  created_by_role VARCHAR(20) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,

  -- Subject Information
  about_type VARCHAR(20),
  about_id VARCHAR(50),
  about_name VARCHAR(255),

  -- Special handling for crew feedback
  crew_manager_id VARCHAR(50), -- If created by crew, store their manager ID

  -- Response
  acknowledged_by_id VARCHAR(50),
  acknowledged_by_name VARCHAR(255),
  acknowledgment_notes TEXT,
  response_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Metadata
  tags TEXT[],
  is_anonymous BOOLEAN DEFAULT false,
  sentiment_score INTEGER, -- -1 (negative) to 1 (positive)

  -- Indexes
  INDEX idx_feedback_status (status),
  INDEX idx_feedback_kind (kind),
  INDEX idx_feedback_created_by (created_by_id, created_by_role),
  INDEX idx_feedback_about (about_type, about_id),
  INDEX idx_feedback_crew_manager (crew_manager_id),
  UNIQUE INDEX idx_feedback_sequence (sequence_number)
);

-- Sequence for feedback IDs
CREATE SEQUENCE feedback_sequence START 1;

-- Similar ID generation for feedback
CREATE OR REPLACE FUNCTION gen_feedback_id()
RETURNS VARCHAR AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  seq_num := nextval('feedback_sequence');
  RETURN 'FDB-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

### Table: `report_status_history`
```sql
CREATE TABLE report_status_history (
  id SERIAL PRIMARY KEY,

  -- Reference
  item_id VARCHAR(10) NOT NULL, -- RPT-XXX or FDB-XXX
  item_type VARCHAR(10) NOT NULL, -- 'report' or 'feedback'

  -- Status Change
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  reason TEXT,

  -- Actor
  changed_by_id VARCHAR(50) NOT NULL,
  changed_by_name VARCHAR(255) NOT NULL,
  changed_by_role VARCHAR(20) NOT NULL,

  -- Notes
  notes TEXT,

  -- Timestamp
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_history_item (item_id, item_type, changed_at DESC),
  INDEX idx_history_changed_by (changed_by_id)
);
```

## Backend API Structure

### File: `apps/backend/server/domains/reports/types.ts`
```typescript
export interface Report {
  reportId: string;
  title: string;
  description: string;
  type: 'safety' | 'performance' | 'policy' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'dismissed' | 'escalated';

  // Creator
  createdById: string;
  createdByRole: UserRole;
  createdByName: string;

  // Subject
  aboutType?: 'crew' | 'customer' | 'center' | 'contractor' | 'operational';
  aboutId?: string;
  aboutName?: string;

  // Special crew handling
  crewManagerId?: string; // For crew-created reports

  // Resolution
  resolvedById?: string;
  resolvedByName?: string;
  resolutionNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface Feedback {
  feedbackId: string;
  title: string;
  message: string;
  kind: 'compliment' | 'suggestion' | 'observation' | 'concern';
  status: 'open' | 'acknowledged' | 'resolved' | 'no_action_needed';

  // Creator
  createdById: string;
  createdByRole: UserRole;
  createdByName: string;

  // Subject
  aboutType?: string;
  aboutId?: string;
  aboutName?: string;

  // Special crew handling
  crewManagerId?: string;

  // Response
  acknowledgedById?: string;
  acknowledgmentNotes?: string;
  responseNotes?: string;

  // Timestamps
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface StatusHistoryEntry {
  itemId: string;
  itemType: 'report' | 'feedback';
  oldStatus: string;
  newStatus: string;
  changedById: string;
  changedByName: string;
  changedAt: Date;
  notes?: string;
}
```

### File: `apps/backend/server/domains/reports/routes.fastify.ts`
```typescript
// Report Management
GET    /api/reports                      - Get reports visible to current user
POST   /api/reports                      - Create new report
GET    /api/reports/:id                  - Get report details (if authorized)
PUT    /api/reports/:id/status           - Update report status
PUT    /api/reports/:id/resolve          - Resolve report with notes
PUT    /api/reports/:id/escalate         - Escalate report
GET    /api/reports/:id/history          - Get status history

// Feedback Management
GET    /api/feedback                     - Get feedback visible to current user
POST   /api/feedback                     - Create new feedback
GET    /api/feedback/:id                 - Get feedback details
PUT    /api/feedback/:id/acknowledge     - Acknowledge feedback
PUT    /api/feedback/:id/resolve         - Resolve feedback

// Role-Specific Endpoints
GET    /api/reports/my                   - User's created reports
GET    /api/feedback/my                  - User's created feedback
GET    /api/reports/about-me             - Reports about current user
GET    /api/feedback/about-me            - Feedback about current user

// Manager-Specific
GET    /api/manager/all-reports          - System-wide reports (managers only)
GET    /api/manager/all-feedback         - System-wide feedback (managers only)
GET    /api/manager/crew-reports         - Reports from crew members

// Warehouse-Specific
GET    /api/warehouse/operational        - Operational reports/feedback

// Statistics
GET    /api/reports/stats                - Report statistics (by role)
GET    /api/feedback/stats               - Feedback statistics (by role)
```

### File: `apps/backend/server/domains/reports/service.ts`
```typescript
export class ReportsService {
  /**
   * Get reports visible to user based on role and relationships
   */
  async getReportsForUser(
    userId: string,
    role: UserRole,
    filters?: ReportFilters
  ): Promise<Report[]> {
    const query = this.buildBaseQuery(filters);

    switch (role) {
      case 'manager':
        // Managers see all reports system-wide
        return this.repository.getAllReports(query);

      case 'crew':
        // Crew see reports they created and reports about them
        query.where = {
          OR: [
            { createdById: userId },
            { aboutId: userId, aboutType: 'crew' }
          ]
        };
        return this.repository.getReports(query);

      case 'customer':
      case 'center':
      case 'contractor':
        // See reports they created and reports involving them
        query.where = {
          OR: [
            { createdById: userId },
            { aboutId: userId },
            { aboutType: role.toLowerCase(), aboutId: userId }
          ]
        };
        return this.repository.getReports(query);

      case 'warehouse':
        // See operational reports
        query.where = {
          OR: [
            { type: 'operational' },
            { aboutType: 'operational' },
            { createdByRole: 'warehouse' }
          ]
        };
        return this.repository.getReports(query);

      default:
        return [];
    }
  }

  /**
   * Create a report with hierarchy validation
   */
  async createReport(
    data: CreateReportDto,
    userId: string,
    role: UserRole
  ): Promise<Report> {
    // Validate hierarchy rules
    await this.validateReportCreation(userId, role, data.aboutType, data.aboutId);

    // Special handling for crew reports
    let crewManagerId: string | undefined;
    if (role === 'crew') {
      // Get the crew member's manager
      const crew = await this.crewService.getCrewMember(userId);
      crewManagerId = crew.managerId;

      if (!crewManagerId) {
        throw new Error('Crew member must have an assigned manager to create reports');
      }
    }

    // Generate report ID
    const reportId = await this.generateReportId();

    // Create report
    const report = await this.repository.createReport({
      ...data,
      reportId,
      createdById: userId,
      createdByRole: role,
      crewManagerId, // Only set for crew-created reports
      status: 'open'
    });

    // Send notifications
    await this.notifyRelevantParties(report);

    return report;
  }

  /**
   * Validate report creation based on hierarchy
   */
  private async validateReportCreation(
    userId: string,
    role: UserRole,
    aboutType?: string,
    aboutId?: string
  ): Promise<void> {
    // Hierarchy rules
    const allowedTargets: Record<UserRole, string[]> = {
      'manager': [], // Managers don't create reports, they resolve them
      'contractor': ['work_environment'], // Can only report about work environment
      'customer': ['center', 'crew'],
      'center': ['crew', 'customer', 'contractor'],
      'crew': ['safety', 'equipment', 'policy'], // Can report issues to manager
      'warehouse': [] // Warehouse doesn't create, only views/resolves operational
    };

    const allowed = allowedTargets[role] || [];

    // Special case for crew - they report to manager, not about others
    if (role === 'crew' && aboutType && !allowed.includes(aboutType)) {
      throw new Error('Crew can only report safety, equipment, or policy issues to their manager');
    }

    if (role !== 'crew' && aboutType && !allowed.includes(aboutType)) {
      throw new Error(`${role} cannot create reports about ${aboutType}`);
    }
  }

  /**
   * Check if user can view a specific report
   */
  async canUserViewReport(
    reportId: string,
    userId: string,
    role: UserRole
  ): Promise<boolean> {
    const report = await this.repository.getReport(reportId);

    // Managers can see everything
    if (role === 'manager') {
      return true;
    }

    // Creator can always see their own report
    if (report.createdById === userId) {
      return true;
    }

    // Subject can see reports about them
    if (report.aboutId === userId) {
      return true;
    }

    // Special case: If crew created it, only their manager can see it
    if (report.createdByRole === 'crew' && report.crewManagerId) {
      return userId === report.crewManagerId;
    }

    // Warehouse can see operational reports
    if (role === 'warehouse' && report.type === 'operational') {
      return true;
    }

    return false;
  }

  /**
   * Resolve a report (managers and warehouse for operational)
   */
  async resolveReport(
    reportId: string,
    resolutionNotes: string,
    userId: string,
    role: UserRole
  ): Promise<Report> {
    const report = await this.repository.getReport(reportId);

    // Check resolution authority
    if (role !== 'manager' &&
        !(role === 'warehouse' && report.type === 'operational')) {
      throw new Error('You do not have authority to resolve this report');
    }

    // Update report
    const resolved = await this.repository.updateReport(reportId, {
      status: 'resolved',
      resolvedById: userId,
      resolvedByRole: role,
      resolutionNotes,
      resolvedAt: new Date()
    });

    // Add to status history
    await this.addStatusHistory(reportId, 'report', report.status, 'resolved', userId, resolutionNotes);

    // Notify creator and subject
    await this.notifyResolution(resolved);

    return resolved;
  }

  /**
   * Get reports created by crew members for a specific manager
   */
  async getCrewReportsForManager(managerId: string): Promise<Report[]> {
    return this.repository.getReports({
      where: {
        crewManagerId: managerId,
        createdByRole: 'crew'
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

## Frontend Integration

### File: `apps/frontend/src/shared/api/reports.ts`
```typescript
// Report hooks
export const useReports = (filters?: ReportFilters) => {
  return useSWR(`/api/reports?${buildQuery(filters)}`);
};

export const useMyReports = () => {
  return useSWR('/api/reports/my');
};

export const useReportsAboutMe = () => {
  return useSWR('/api/reports/about-me');
};

export const useCreateReport = () => {
  return useSWRMutation('/api/reports', postRequest);
};

export const useResolveReport = () => {
  return useSWRMutation(
    (data: { reportId: string; notes: string }) =>
      `/api/reports/${data.reportId}/resolve`,
    putRequest
  );
};

// Feedback hooks
export const useFeedback = (filters?: FeedbackFilters) => {
  return useSWR(`/api/feedback?${buildQuery(filters)}`);
};

export const useMyFeedback = () => {
  return useSWR('/api/feedback/my');
};

export const useCreateFeedback = () => {
  return useSWRMutation('/api/feedback', postRequest);
};

// Manager-specific hooks
export const useAllReports = () => {
  return useSWR('/api/manager/all-reports');
};

export const useCrewReports = () => {
  return useSWR('/api/manager/crew-reports');
};

// Stats
export const useReportStats = () => {
  return useSWR('/api/reports/stats');
};
```

## User Interface by Role

### Manager Interface
```typescript
const ManagerReportsView = () => {
  const { data: allReports } = useAllReports();
  const { data: allFeedback } = useAllFeedback();
  const { data: crewReports } = useCrewReports(); // Special section for crew reports

  return (
    <div>
      {/* Crew Reports Section - Priority visibility */}
      <Section title="Crew Reports" priority>
        <DataTable
          columns={[
            { key: 'reportId', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'createdByName', label: 'Crew Member' },
            { key: 'severity', label: 'Severity', render: renderSeverityBadge },
            { key: 'status', label: 'Status', render: renderStatusBadge },
            { key: 'createdAt', label: 'Date' }
          ]}
          data={crewReports}
          onRowClick={(report) => openResolveModal(report)}
        />
      </Section>

      {/* All System Reports */}
      <Section title="All Reports">
        {/* Similar table for all reports */}
      </Section>

      {/* All Feedback */}
      <Section title="All Feedback">
        {/* Feedback table */}
      </Section>
    </div>
  );
};
```

### Crew Interface (Updated)
```typescript
const CrewReportsView = () => {
  const [tab, setTab] = useState<'create' | 'my' | 'about'>('create');
  const createReport = useCreateReport();
  const createFeedback = useCreateFeedback();
  const { data: myReports } = useMyReports();
  const { data: aboutMe } = useReportsAboutMe();

  return (
    <TabSection
      tabs={[
        { id: 'create', label: 'Report Issue' },
        { id: 'my', label: 'My Reports', count: myReports?.length },
        { id: 'about', label: 'About Me', count: aboutMe?.length }
      ]}
    >
      {tab === 'create' && (
        <div>
          <h3>Report to Manager</h3>
          <p>Report safety concerns, equipment issues, or policy violations directly to your manager</p>

          <Form onSubmit={handleSubmit}>
            <Select
              label="Type"
              options={[
                { value: 'safety', label: 'Safety Concern' },
                { value: 'equipment', label: 'Equipment Issue' },
                { value: 'policy', label: 'Policy Violation' },
                { value: 'operational', label: 'Operational Issue' }
              ]}
            />
            <Select
              label="Severity"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical - Immediate Attention' }
              ]}
            />
            <Input label="Title" required />
            <Textarea label="Description" required />
            <Button type="submit">Submit to Manager</Button>
          </Form>

          <Divider />

          <h3>Provide Feedback</h3>
          <Form onSubmit={handleFeedbackSubmit}>
            {/* Feedback form */}
          </Form>
        </div>
      )}

      {tab === 'my' && (
        <DataTable
          columns={[
            { key: 'reportId', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status', render: renderStatusBadge },
            { key: 'createdAt', label: 'Created' },
            { key: 'resolutionNotes', label: 'Resolution' }
          ]}
          data={myReports}
        />
      )}

      {tab === 'about' && (
        <DataTable
          columns={reportColumns}
          data={aboutMe}
          readOnly
        />
      )}
    </TabSection>
  );
};
```

### Customer/Center/Contractor Interface
```typescript
const StandardReportsView = ({ role }) => {
  const [tab, setTab] = useState('create');
  const [reportType, setReportType] = useState<'report' | 'feedback'>('report');

  // Get allowed entities based on role
  const allowedEntities = getAllowedEntities(role);

  return (
    <TabSection tabs={tabs}>
      {tab === 'create' && (
        <div>
          <Toggle
            options={['Report', 'Feedback']}
            value={reportType}
            onChange={setReportType}
          />

          <Form>
            <Select
              label="About"
              options={allowedEntities}
              required
            />

            {reportType === 'report' ? (
              <>
                <Select label="Type" options={reportTypes} />
                <Select label="Severity" options={severityLevels} />
                <Input label="Title" required />
                <Textarea label="Description" required />
              </>
            ) : (
              <>
                <Select label="Kind" options={feedbackKinds} />
                <Input label="Title" required />
                <Textarea label="Message" required />
              </>
            )}

            <Button type="submit">Submit {reportType}</Button>
          </Form>
        </div>
      )}

      {/* My Reports/Feedback tabs */}
      {/* View All tab with toggle */}
    </TabSection>
  );
};
```

## Business Rules Implementation

### Hierarchy Enforcement
```typescript
const hierarchyRules = {
  customer: {
    canReportAbout: ['center', 'crew'],
    cannotReportAbout: ['customer', 'contractor', 'manager', 'warehouse']
  },
  center: {
    canReportAbout: ['crew', 'customer', 'contractor'],
    cannotReportAbout: ['center', 'manager', 'warehouse']
  },
  contractor: {
    canReportAbout: ['work_environment'], // Special case - to managers only
    cannotReportAbout: ['crew', 'customer', 'center', 'contractor', 'manager']
  },
  crew: {
    // NEW: Crew reports to their manager only
    canReportAbout: [], // Not about others, but TO manager
    reportTypes: ['safety', 'equipment', 'policy', 'operational']
  },
  warehouse: {
    canReportAbout: [], // View/resolve only
    canResolve: ['operational']
  },
  manager: {
    canReportAbout: [], // Managers don't create, they resolve
    canResolve: ['all'] // Can resolve everything
  }
};
```

### Visibility Rules
```typescript
function getReportVisibility(report: Report, userId: string, userRole: UserRole): boolean {
  // Manager sees all
  if (userRole === 'manager') {
    return true;
  }

  // Creator sees own
  if (report.createdById === userId) {
    return true;
  }

  // Subject sees reports about them
  if (report.aboutId === userId) {
    return true;
  }

  // NEW: Crew reports only visible to their manager
  if (report.createdByRole === 'crew') {
    return userId === report.crewManagerId;
  }

  // Warehouse sees operational
  if (userRole === 'warehouse' && report.type === 'operational') {
    return true;
  }

  return false;
}
```

## Status Workflows

### Report Status Flow
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
  ↓         ↓            ↓
DISMISSED  ESCALATED   (auto after 30 days)
```

### Feedback Status Flow
```
OPEN → ACKNOWLEDGED → RESOLVED
  ↓         ↓
NO_ACTION_NEEDED
```

## Implementation Phases

### Phase 1: Core Structure (Week 1)
1. Database tables and migrations
2. ID generation system
3. Basic CRUD operations
4. Role-based visibility queries

### Phase 2: Creation & Visibility (Week 1-2)
1. Hierarchy validation
2. Crew-to-manager reporting
3. Entity selection dropdowns
4. Form validation

### Phase 3: Resolution System (Week 2)
1. Manager resolution interface
2. Warehouse operational resolution
3. Status history tracking
4. Resolution notifications

### Phase 4: UI & Polish (Week 2-3)
1. Role-specific interfaces
2. Status badges and colors
3. Filtering and search
4. Export functionality

## Testing Strategy

### Unit Tests
```typescript
describe('ReportsService', () => {
  describe('Crew Reports', () => {
    test('crew reports only visible to their manager', async () => {
      const crewId = 'CRW-001';
      const managerId = 'MGR-001';
      const report = await service.createReport(
        { title: 'Safety Issue', type: 'safety' },
        crewId,
        'crew'
      );

      // Manager can see it
      const managerReports = await service.getReportsForUser(managerId, 'manager');
      expect(managerReports).toContainEqual(report);

      // Other managers cannot
      const otherReports = await service.getReportsForUser('MGR-002', 'manager');
      expect(otherReports).not.toContainEqual(report);
    });
  });

  describe('Hierarchy Rules', () => {
    test('customer cannot report about other customers', async () => {
      await expect(
        service.createReport(
          { aboutType: 'customer', aboutId: 'CUST-002' },
          'CUST-001',
          'customer'
        )
      ).rejects.toThrow('cannot create reports about customer');
    });
  });
});
```

## Security Considerations

1. **Role Verification**: Always verify user role from JWT, not request body
2. **ID Tampering**: Validate that IDs in requests match authenticated user
3. **Cross-tenant Isolation**: Ensure reports don't leak across organizational boundaries
4. **Sensitive Data**: Mark certain reports as confidential with restricted visibility
5. **Audit Trail**: Complete history of all status changes and resolutions

## Performance Optimizations

1. **Index Strategy**: Indexes on all foreign keys and filter columns
2. **Materialized Views**: For manager dashboard aggregations
3. **Pagination**: Required for all list endpoints (default 20 items)
4. **Caching**: Cache role permissions and hierarchy rules
5. **Batch Operations**: Bulk status updates for managers

## Key Differences from Original Spec

### What Changed
- ✅ **Crew CAN create reports/feedback** (not view-only)
- ✅ **Crew reports only visible to their manager** (not system-wide)
- ✅ Added `crew_manager_id` field for routing crew reports
- ✅ Special handling in visibility rules for crew-created items

### What Stayed the Same
- ✅ Hierarchy-based reporting rules
- ✅ Manager system-wide resolution authority
- ✅ Dual Reports/Feedback system
- ✅ ID format (RPT-XXX, FDB-XXX)
- ✅ Complete audit trail

## Summary

The Reports & Feedback system provides structured issue tracking and communication across the CKS ecosystem. The key innovation is the hierarchy-based permission system where users can only report about entities "below" them, with the special case of crew members who report directly to their manager. This ensures issues flow upward through proper channels while maintaining appropriate visibility boundaries.