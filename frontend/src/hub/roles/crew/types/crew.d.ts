/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * crew.d.ts
 * 
 * Description: TypeScript type definitions for Crew hub
 * Function: Provides type safety for crew-specific data structures
 * Importance: Critical - Ensures type safety across Crew hub
 * Connects to: All Crew components, API calls, and data management
 * 
 * Notes: Crew-specific types for team management and operational coordination.
 *        Extends base CKS types with crew-specific properties.
 */

export interface Crew {
  crew_id: string;                // CRW-XXX format
  name: string;                   // Crew name
  leader_id: string;              // Crew leader contractor ID
  team_type: CrewType;            // Type of crew specialization
  size: number;                   // Number of crew members
  status: CrewStatus;             // Current operational status
  
  // Location and coverage
  base_location: Address;         // Primary operating location
  service_radius: number;         // Coverage radius in miles
  territories: string[];          // Assigned territory IDs
  
  // Team composition
  members: CrewMember[];          // Crew member details
  skills: string[];               // Combined crew skills
  certifications: string[];      // Team certifications
  equipment: Equipment[];         // Assigned equipment
  
  // Performance metrics
  completion_rate: number;        // Job completion percentage
  efficiency_rating: number;     // Performance rating (0-5)
  customer_satisfaction: number; // Customer satisfaction (0-5)
  safety_score: number;          // Safety compliance score
  
  // Operational data
  active_jobs: number;           // Currently assigned jobs
  total_jobs: number;            // Historical job count
  avg_job_duration: number;      // Average completion time (hours)
  specializations: string[];     // Service specializations
  
  // Schedule and availability
  availability_schedule: Schedule;
  current_availability: AvailabilityStatus;
  next_available: string;        // ISO timestamp
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CrewMember {
  contractor_id: string;          // CON-XXX format
  name: string;                   // Member name
  role: CrewRole;                 // Role in crew
  skills: string[];               // Individual skills
  certifications: string[];      // Individual certifications
  join_date: string;              // Date joined crew
  performance_rating: number;    // Individual performance (0-5)
  status: MemberStatus;          // Current status
}

export interface Equipment {
  equipment_id: string;           // EQP-XXX format
  name: string;                   // Equipment name
  type: EquipmentType;           // Equipment category
  condition: EquipmentCondition; // Current condition
  last_maintenance: string;       // Last maintenance date
  next_maintenance: string;       // Next scheduled maintenance
  assigned_to?: string;          // Assigned member ID
  status: EquipmentStatus;       // Operational status
}

export interface CrewJob {
  job_id: string;                 // JOB-XXX format
  crew_id: string;                // Assigned crew
  order_id: string;               // Related order
  customer_id: string;            // Customer
  service_type: string;           // Type of service
  priority: JobPriority;          // Job priority level
  status: JobStatus;              // Current status
  
  // Location and scheduling
  location: Address;              // Job location
  scheduled_start: string;        // Scheduled start time
  scheduled_end: string;          // Scheduled end time
  actual_start?: string;          // Actual start time
  actual_end?: string;            // Actual completion time
  
  // Requirements
  required_skills: string[];      // Required skills
  required_equipment: string[];   // Required equipment
  crew_size_needed: number;       // Minimum crew size
  
  // Progress tracking
  completion_percentage: number;  // Progress percentage
  notes: string;                  // Job notes
  issues: JobIssue[];            // Reported issues
  
  // Financial
  estimated_cost: number;         // Estimated job cost
  actual_cost?: number;          // Actual job cost
  labor_hours: number;           // Total labor hours
}

export interface JobIssue {
  issue_id: string;
  type: IssueType;
  description: string;
  severity: IssueSeverity;
  reported_by: string;           // Crew member ID
  reported_at: string;           // Report timestamp
  resolved: boolean;
  resolution?: string;
  resolved_at?: string;
}

export interface Schedule {
  [key: string]: {              // Day of week
    available: boolean;
    start_time: string;         // HH:MM format
    end_time: string;          // HH:MM format
    break_duration: number;    // Minutes
  };
}

export interface CrewMetrics {
  crew_id: string;
  period_start: string;
  period_end: string;
  
  // Job metrics
  jobs_completed: number;
  jobs_cancelled: number;
  jobs_in_progress: number;
  completion_rate: number;       // Percentage
  
  // Performance metrics
  avg_response_time: number;     // Minutes
  avg_completion_time: number;   // Hours
  customer_satisfaction: number; // Rating 1-5
  efficiency_score: number;     // Calculated efficiency
  
  // Safety and quality
  safety_incidents: number;
  quality_issues: number;
  rework_rate: number;          // Percentage
  
  // Financial metrics
  total_revenue: number;
  labor_cost: number;
  equipment_cost: number;
  profit_margin: number;        // Percentage
  
  // Utilization
  billable_hours: number;
  available_hours: number;
  utilization_rate: number;     // Percentage
}

export interface CrewActivity {
  activity_id: string;
  crew_id: string;
  activity_type: CrewActivityType;
  description: string;
  actor_id: string;             // Crew member who performed action
  job_id?: string;              // Related job (if applicable)
  equipment_id?: string;        // Related equipment (if applicable)
  metadata: Record<string, any>;
  created_at: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Enums and Types
export type CrewType = 
  | 'general'           // General maintenance crew
  | 'specialized'       // Specialized service crew
  | 'emergency'         // Emergency response crew
  | 'installation'      // Installation crew
  | 'repair'           // Repair specialists
  | 'inspection';      // Inspection team

export type CrewStatus = 
  | 'active'           // Available for assignments
  | 'busy'             // Currently on job
  | 'break'            // On scheduled break
  | 'maintenance'      // Equipment maintenance
  | 'offline'          // Not available
  | 'emergency';       // Emergency response mode

export type CrewRole = 
  | 'leader'           // Crew leader
  | 'specialist'       // Technical specialist
  | 'technician'       // General technician
  | 'apprentice'       // Learning/junior member
  | 'support'          // Support role
  | 'safety_officer';  // Safety specialist

export type MemberStatus = 
  | 'active'           // Active crew member
  | 'inactive'         // Temporarily inactive
  | 'on_leave'         // On leave
  | 'training'         // In training
  | 'suspended';       // Suspended

export type EquipmentType = 
  | 'vehicle'          // Service vehicle
  | 'tool'             // Hand tools
  | 'machinery'        // Heavy machinery
  | 'safety'           // Safety equipment
  | 'measurement'      // Testing/measurement tools
  | 'communication';   // Communication devices

export type EquipmentCondition = 
  | 'excellent'        // Like new
  | 'good'             // Good working order
  | 'fair'             // Some wear
  | 'poor'             // Needs attention
  | 'broken';          // Out of service

export type EquipmentStatus = 
  | 'available'        // Ready for use
  | 'in_use'           // Currently assigned
  | 'maintenance'      // Under maintenance
  | 'repair'           // Being repaired
  | 'retired';         // End of life

export type JobPriority = 'low' | 'medium' | 'high' | 'urgent' | 'emergency';

export type JobStatus = 
  | 'assigned'         // Assigned to crew
  | 'traveling'        // En route to location
  | 'in_progress'      // Work in progress
  | 'paused'           // Temporarily paused
  | 'completed'        // Successfully completed
  | 'cancelled'        // Cancelled
  | 'failed';          // Failed to complete

export type IssueType = 
  | 'equipment_failure'
  | 'safety_concern'
  | 'customer_issue'
  | 'access_problem'
  | 'weather_delay'
  | 'material_shortage'
  | 'technical_difficulty';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AvailabilityStatus = 
  | 'available'        // Ready for new jobs
  | 'busy'             // On active job
  | 'scheduled'        // Has upcoming jobs
  | 'unavailable';     // Not available

export type CrewActivityType = 
  | 'job_assignment'
  | 'job_completion'
  | 'member_added'
  | 'member_removed'
  | 'equipment_assigned'
  | 'equipment_maintenance'
  | 'schedule_update'
  | 'performance_review'
  | 'safety_incident'
  | 'training_completed';

// API Response Types
export interface CrewApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedCrewResponse<T> extends CrewApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

// Hook Types
export interface CrewDataState {
  loading: boolean;
  error: string | null;
  kind: string;
  data: Crew | null;
  _source?: string;
}

// Component Props
export interface CrewComponentProps {
  crewId: string;
  onError?: (error: string) => void;
  onSuccess?: (data: any) => void;
}