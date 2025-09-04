# CKS Portal - Field Mapping Documentation

*Property of CKS © 2025 - Manifested by Freedom*

**Purpose**: Document all fields needed for user-specific data population across hubs.  
**Method**: Systematic analysis of each hub section to identify required database fields.  
**Goal**: Create comprehensive field mapping before building user creation system.

---

## 🔴 CREW HUB - Profile Fields Analysis

### 🧠 OG Brain Section (Dashboard Header)
**Location**: Top of Crew Hub page  
**Purpose**: Quick overview of crew member status and metrics

| Field Name | Example Value | Data Type | Source Table | Notes |
|------------|--------------|-----------|--------------|--------|
| **Full Name** | Mike Johnson | String | crew.crew_name | Display name for crew member |
| **Crew ID** | crw-000 | String | crew.crew_id | Primary identifier |
| **Role/Title** | Crew Leader | String | crew.role OR crew.certification_level | Job title or role designation |
| **Location** | Downtown Operations Center | String | centers.center_name (via crew.assigned_center) | Current work location |
| **Hours This Week** | 32 | Number | Calculated/Timesheet data | Weekly work hours |
| **Tasks Completed** | 15 | Number | Calculated from task system | Completed tasks count |
| **Current Status** | On Duty | Enum | crew.status OR real-time status | Active/Inactive/On Duty/Off Duty |
| **Shift Schedule** | Morning (6 AM - 2 PM) | String | crew.shift_schedule OR schedule table | Work schedule information |
| **Training Due** | 1 Module | Number | Calculated from training system | Outstanding training count |

### 👤 My Profile Section  
**Location**: "My Profile" tab in Crew Hub  
**Purpose**: Detailed crew member information and contact details

| Field Name | Example Value | Data Type | Source Table | Notes |
|------------|--------------|-----------|--------------|--------|
| **Full Name** | Mike Johnson | String | crew.crew_name | Same as dashboard |
| **Employee ID** | EMP-12345 | String | crew.employee_id | Internal HR identifier (NEW FIELD) |
| **Crew ID** | crw-000 | String | crew.crew_id | Primary identifier |
| **Role** | Crew Leader | String | crew.role | Job role/position |
| **Email** | mike.johnson@cks-crew.com | String | crew.email | Contact email |
| **Phone** | (555) 234-5678 | String | crew.phone | Contact phone |
| **Hire Date** | 2023-03-15 | Date | crew.hire_date | Employment start date (NEW FIELD) |
| **Supervisor** | John Center | String | centers.supervisor_name OR managers.manager_name | Direct supervisor (relationship field) |

---

## 📊 CREW HUB - Required Database Fields Summary

### New Fields Needed in `crew` Table:
```sql
-- Fields identified from Crew Hub analysis that are missing from current schema
ALTER TABLE crew ADD COLUMN employee_id VARCHAR(50);           -- EMP-12345
ALTER TABLE crew ADD COLUMN role VARCHAR(100);                 -- "Crew Leader"
ALTER TABLE crew ADD COLUMN email VARCHAR(255);                -- Contact email  
ALTER TABLE crew ADD COLUMN phone VARCHAR(50);                 -- Contact phone
ALTER TABLE crew ADD COLUMN hire_date DATE;                    -- Employment start
ALTER TABLE crew ADD COLUMN shift_schedule VARCHAR(100);       -- "Morning (6 AM - 2 PM)"
```

### Relationship Fields Needed:
- **Supervisor**: Requires lookup to either centers.supervisor_name or managers.manager_name via crew.assigned_center
- **Location**: Requires lookup to centers.center_name via crew.assigned_center

### Calculated Fields Needed:
- **Hours This Week**: Requires timesheet/time tracking system
- **Tasks Completed**: Requires task management system integration  
- **Training Due**: Requires training module tracking system

---

## 🎯 ADMIN HUB - Required Crew Creation Fields

Based on Crew Hub analysis, when Admin creates a new Crew member, the form needs:

### Required Fields:
- **Crew ID** (CRW-XXX format) - Auto-generated dropdown
- **Full Name** - Text input
- **Role** - Dropdown (Crew Leader, Crew Member, Specialist, etc.)
- **Assigned Center** - Dropdown populated from centers table
- **Email** - Text input (email validation)
- **Phone** - Text input (phone format validation)
- **Hire Date** - Date picker
- **Shift Schedule** - Dropdown (Morning, Evening, Night, etc.)
- **Skills** - Multi-select (cleaning, maintenance, security, etc.)
- **Certification Level** - Dropdown
- **Status** - Dropdown (active, inactive, pending)

### Relationship Dropdowns Needed:
- **Assigned Center**: `SELECT center_id, center_name FROM centers WHERE status = 'active'`
- **Manager**: `SELECT manager_id, manager_name FROM managers WHERE status = 'active'`

---

## 🟢 CONTRACTOR HUB - Profile Field Mapping (MVP)

This section defines the Contractor profile fields, their data sources, and creation vs. post‑creation responsibilities.

### Admin Create → Contractor (Required at Creation)

UI: Admin Hub → Create → Contractor

- Company Name → DB: contractors.company_name (TEXT, required)
- Address → DB: contractors.address (TEXT, required)
- Main Contact → DB: contractors.contact_person (TEXT, required)
- Phone → DB: contractors.phone (VARCHAR, required)
- Email → DB: contractors.email (VARCHAR, required)
- Website → DB: contractors.website (TEXT, required)

System behavior at creation:
- Contractor ID auto‑generate → CON-### sequence (CON-001, CON-002, …)
- Status defaults to active → contractors.status = 'active'
- cks_manager remains NULL (assigned later via Admin Assign)

API: POST /api/admin/users with body:
```
{
  "role": "contractor",
  "company_name": "Acme Services LLC",
  "contact_person": "Jane Doe",
  "phone": "(555) 555-1212",
  "email": "ops@acme.com",
  "address": "123 Main St, Springfield, ST 12345",
  "website": "https://acme.com"
}
```

### Post‑Creation (Derived/Assigned)

- Contractor ID → already generated at creation
- CKS Manager (Assigned) → contractors.cks_manager (NULL until assignment)
- Years with CKS → computed from contractors.created_at (>= 1)
- Contract Start Date → contractors.created_at (YYYY‑MM‑DD)
- Status → contractors.status (default active)
- Services Specialized In → derived later from catalog selections

### Contractor Hub → Company Profile (Read API)

API: GET /api/contractor/profile?code=CON-###

Returns:
- contractor_id, company_name, cks_manager, main_contact, email, phone, address, website, status
- years_with_cks (computed), contract_start_date (computed), num_customers (computed)
- services_specialized (placeholder for future), payment_status (placeholder)

Notes:
- The frontend hook will pass ?code= from URL/path/session to ensure correct record resolution.

---

---

## 🔴 CREW HUB - MY PROFILE TABS (Detailed Analysis)

### Tab Structure Overview
The My Profile section has **5 tabs** with role-based visibility controls:

| Tab Name | Visibility | Purpose |
|----------|-----------|---------|
| **Personal Info** | All Roles | Basic contact and personal details |
| **Work Details** | Manager+ Only | Job-specific information and assignments |
| **Certifications** | Manager+ Only | Skills, training, and certification status |
| **Emergency Contact** | Manager+ Only | Emergency contact information |
| **Performance** | Manager+ Only | Reviews, ratings, and performance metrics |

### 🔸 TAB 1: PERSONAL INFO ✅ IMPLEMENTED
**Visibility**: ✅ All roles can view (Crew, Manager, Admin)  
**Purpose**: Basic identification and contact information
**Status**: ✅ Completed - All fields implemented with "Not Set" fallbacks

| Field Name | Example Value | Data Type | Source | Required | Implementation Status |
|------------|--------------|-----------|---------|----------|---------------------|
| **Full Name** | Mike Johnson | String | crew.crew_name | Yes | ✅ Implemented |
| **Reports To (Manager ID)** | MGR-001 | String | crew.manager_id | No | ✅ Implemented |
| **Crew ID** | crw-000 | String | crew.crew_id | Yes | ✅ Implemented |
| **Role** | Crew Leader | String | crew.role | Yes | ✅ Implemented |
| **Start Date** | 2023-03-15 | Date | crew.hire_date | No | ✅ Implemented |
| **Years with Company** | 1.5 years | Calculated | Based on hire_date | No | ✅ Implemented |
| **Primary Region** | Downtown District | String | crew.primary_region | No | ✅ Implemented |
| **Email** | mike.johnson@cks-crew.com | String | crew.email | Yes | ✅ Implemented |
| **Languages** | English, Spanish | String[] | crew.languages | No | ✅ Implemented |
| **Phone** | (555) 234-5678 | String | crew.phone | Yes | ✅ Implemented |
| **Emergency Contact** | Sarah Johnson | String | crew.emergency_contact_name | No | ✅ Implemented |
| **Home Address** | 123 Main St, City, ST 12345 | String | crew.home_address | No | ✅ Implemented |
| **LinkedIn** | linkedin.com/in/mike-j | String | crew.linkedin | No | ✅ Implemented |
| **Status** | Active | Enum | crew.status | Yes | ✅ Implemented |
| **Availability** | Monday-Friday | String | crew.availability | No | ✅ Implemented |
| **Preferred Areas** | Downtown, Midtown | String | crew.preferred_areas | No | ✅ Implemented |
| **QR Code** | [Generated QR] | String | crew.qr_code | No | ✅ Implemented |

### 🔸 TAB 2: WORK DETAILS ✅ IMPLEMENTED
**Visibility**: 🔒 Manager+ Only (Crew cannot see colleague work details)  
**Purpose**: Job assignments, work location, and operational information
**Status**: ✅ Completed - All fields implemented with "Not Set" fallbacks

| Field Name | Example Value | Data Type | Source | Required | Notes |
|------------|--------------|-----------|---------|----------|--------|
| **Assigned Center** | Downtown Operations Center | String | centers.center_name (via crew.assigned_center) | Yes | Current work location |
| **Manager/Supervisor** | John Center | String | managers.manager_name | Yes | Direct supervisor |
| **Hire Date** | 2023-03-15 | Date | crew.hire_date | Yes | Employment start |
| **Years with Company** | 1.5 years | Calculated | Based on hire_date | No | Tenure calculation |
| **Primary Region** | Downtown District | String | crew.primary_region | No | Geographic area |
| **Shift Schedule** | Morning (6 AM - 2 PM) | String | crew.shift_schedule | Yes | Work schedule |
| **Employment Type** | Full-time | Enum | crew.employment_type | Yes | Full/Part/Contract |
| **Department** | Facilities Management | String | crew.department | No | Organizational unit |
| **Pay Rate** | $18.50/hour | Currency | crew.pay_rate | No | Compensation (sensitive) |
| **Availability** | Monday-Friday | String | crew.availability | No | Available work days |

### 🔸 TAB 3: CERTIFICATIONS ✅ IMPLEMENTED
**Visibility**: 🔒 Manager+ Only  
**Purpose**: Skills, training status, and professional certifications
**Status**: ✅ Completed - All fields implemented with "Not Set" fallbacks

| Field Name | Example Value | Data Type | Source | Required | Notes |
|------------|--------------|-----------|---------|----------|--------|
| **Primary Skills** | Janitorial, Floor Care, HVAC | String[] | crew.skills | Yes | Core competencies |
| **Certification Level** | Level 3 Certified | String | crew.certification_level | No | Overall skill level |
| **OSHA Training** | ✅ Current (Exp: 2025-12-01) | Boolean + Date | crew_certifications.osha_cert | No | Safety certification |
| **Equipment Training** | Floor Buffer, Carpet Cleaner | String[] | crew_certifications.equipment | No | Tool certifications |
| **Specialized Training** | Biohazard Cleanup | String[] | crew_certifications.specialized | No | Special skills |
| **Training Progress** | 85% Complete (3 of 4 modules) | Calculated | training_progress table | No | Current training status |
| **Next Training Due** | Fire Safety Refresher - 2025-09-15 | String + Date | training_schedule table | No | Upcoming requirements |
| **Training Hours YTD** | 24 hours | Number | training_logs table | No | Annual training time |

### 🔸 TAB 4: EMERGENCY CONTACT ✅ IMPLEMENTED
**Visibility**: 🔒 Manager+ Only (Sensitive personal information)  
**Purpose**: Emergency contact and medical information
**Status**: ✅ Completed - All fields implemented with "Not Set" fallbacks

| Field Name | Example Value | Data Type | Source | Required | Notes |
|------------|--------------|-----------|---------|----------|--------|
| **Emergency Contact Name** | Sarah Johnson | String | crew.emergency_contact_name | Yes | Primary contact |
| **Relationship** | Spouse | String | crew.emergency_relationship | Yes | Relationship to employee |
| **Emergency Phone** | (555) 987-6543 | String | crew.emergency_phone | Yes | Contact number |
| **Emergency Email** | sarah.johnson@email.com | String | crew.emergency_email | No | Contact email |
| **Medical Conditions** | None | String | crew.medical_conditions | No | Relevant medical info |
| **Medications** | None | String | crew.medications | No | Current medications |
| **Allergies** | Peanuts, Shellfish | String | crew.allergies | No | Known allergies |
| **Blood Type** | O+ | String | crew.blood_type | No | Medical emergency info |
| **Insurance Provider** | Blue Cross Blue Shield | String | crew.insurance_provider | No | Health insurance |
| **Insurance ID** | BC123456789 | String | crew.insurance_id | No | Insurance identifier |

### 🔸 TAB 5: PERFORMANCE ✅ IMPLEMENTED
**Visibility**: 🔒 Manager+ Only (Performance reviews and ratings)  
**Purpose**: Performance metrics, reviews, and career development
**Status**: ✅ Completed - All fields implemented with "Not Set" fallbacks

| Field Name | Example Value | Data Type | Source | Required | Notes |
|------------|--------------|-----------|---------|----------|--------|
| **Overall Rating** | ⭐⭐⭐⭐⭐ (4.8/5.0) | Number | performance_reviews.overall_rating | No | Current performance rating |
| **Last Review Date** | 2024-06-15 | Date | performance_reviews.review_date | No | Most recent review |
| **Next Review Due** | 2024-12-15 | Date | performance_reviews.next_review | No | Upcoming review |
| **Quality Rating** | 4.9/5.0 | Number | performance_reviews.quality_rating | No | Work quality score |
| **Reliability Rating** | 4.7/5.0 | Number | performance_reviews.reliability_rating | No | Dependability score |
| **Teamwork Rating** | 4.8/5.0 | Number | performance_reviews.teamwork_rating | No | Collaboration score |
| **Punctuality** | 98% On-time | Percentage | attendance_records | No | Attendance metric |
| **Tasks Completed YTD** | 1,247 tasks | Number | task_completion_logs | No | Annual productivity |
| **Customer Feedback Score** | 4.6/5.0 | Number | customer_feedback_logs | No | Client satisfaction |
| **Goals for Next Quarter** | Complete HVAC certification | Text | performance_reviews.goals | No | Development objectives |
| **Manager Notes** | Excellent work ethic... | Text | performance_reviews.manager_notes | No | Supervisor comments |
| **Disciplinary Actions** | None | Text | disciplinary_records | No | Disciplinary history |

---

## 📊 CREW HUB - Database Impact Summary

### New Tables Needed:
```sql
-- Certifications tracking
CREATE TABLE crew_certifications (
    id SERIAL PRIMARY KEY,
    crew_id VARCHAR(20) REFERENCES crew(crew_id),
    certification_type VARCHAR(100),
    obtained_date DATE,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Performance reviews
CREATE TABLE performance_reviews (
    id SERIAL PRIMARY KEY,
    crew_id VARCHAR(20) REFERENCES crew(crew_id),
    review_date DATE,
    overall_rating DECIMAL(2,1),
    quality_rating DECIMAL(2,1),
    reliability_rating DECIMAL(2,1),
    teamwork_rating DECIMAL(2,1),
    goals TEXT,
    manager_notes TEXT,
    next_review DATE
);

-- Training progress
CREATE TABLE training_progress (
    id SERIAL PRIMARY KEY,
    crew_id VARCHAR(20) REFERENCES crew(crew_id),
    training_module_id VARCHAR(20),
    completion_status VARCHAR(20),
    completed_date DATE,
    hours_completed DECIMAL(4,2)
);
```

### Enhanced Crew Table Fields:
```sql
ALTER TABLE crew ADD COLUMN home_address TEXT;
ALTER TABLE crew ADD COLUMN languages TEXT[];
ALTER TABLE crew ADD COLUMN primary_region VARCHAR(100);
ALTER TABLE crew ADD COLUMN employment_type VARCHAR(50);
ALTER TABLE crew ADD COLUMN department VARCHAR(100);
ALTER TABLE crew ADD COLUMN pay_rate DECIMAL(8,2);
ALTER TABLE crew ADD COLUMN availability VARCHAR(100);
ALTER TABLE crew ADD COLUMN emergency_contact_name VARCHAR(255);
ALTER TABLE crew ADD COLUMN emergency_relationship VARCHAR(100);
ALTER TABLE crew ADD COLUMN emergency_phone VARCHAR(50);
ALTER TABLE crew ADD COLUMN emergency_email VARCHAR(255);
ALTER TABLE crew ADD COLUMN medical_conditions TEXT;
ALTER TABLE crew ADD COLUMN medications TEXT;
ALTER TABLE crew ADD COLUMN allergies TEXT;
ALTER TABLE crew ADD COLUMN blood_type VARCHAR(10);
ALTER TABLE crew ADD COLUMN insurance_provider VARCHAR(100);
ALTER TABLE crew ADD COLUMN insurance_id VARCHAR(50);
```

---

## 🔄 Next Steps

1. ✅ **Crew Hub Profile Tabs** - ✅ ALL 5 TABS COMPLETED
   - ✅ Personal Info Tab (17 fields implemented)
   - ✅ Work Details Tab (10 fields implemented)  
   - ✅ Certifications Tab (8 fields implemented)
   - ✅ Emergency Contact Tab (10 fields implemented)
   - ✅ Performance Tab (12 fields implemented)

2. ⏭️ **Crew Hub Other Sections** (Work Dashboard, Schedule, Tasks, Training, etc.)
3. ⏭️ **Manager Hub Profile Fields**
4. ⏭️ **Center Hub Profile Fields** 
5. ⏭️ **Customer Hub Profile Fields**
6. ⏭️ **Contractor Hub Profile Fields**
7. ⏭️ **Admin Hub Profile Fields**

Each section will be analyzed systematically to build the complete field mapping for the user creation system.

---

**Last Updated**: 2025-08-25  
**Status**: ✅ ALL Crew Hub Profile Tabs Complete (57 total fields implemented)  
**Next**: Continue with other Crew Hub sections or move to next hub analysis
