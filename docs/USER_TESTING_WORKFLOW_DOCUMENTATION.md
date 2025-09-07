# CKS Portal - User Testing & Workflow Documentation

*Created: 2025-09-07*  
*Property of CKS © 2025 – Manifested by Freedom*

## Overview

This document tracks comprehensive user testing workflows, logic flows, and UI validation for the CKS Portal system. It serves as a continuation guide for agents to understand where testing is in progress and what needs to be validated.

## Current Testing Status

### 🏗️ CURRENT PHASE: Manager → Contractor → Assignment Workflow Testing

**Last Updated:** 2025-09-07
**Data State:** CLEAN - All users and activity cleared for fresh testing
**Starting Point:** Creating MGR-001 for comprehensive workflow testing

### ✅ Recently Completed Infrastructure Work
- **Archive System**: Fully implemented with soft delete, restore, and hard delete
- **User Management**: Clear all users, clear all activity functions added
- **Database**: Clean state achieved - ready for fresh testing
- **Metrics**: User count properly excludes archived users

---

## Testing Workflow Plan

### Phase 1: Manager Creation & Validation ⚠️ IN PROGRESS
**Current Task**: User is creating MGR-001 to test manager creation flow

#### Manager Creation Checklist
- [ ] **UI Test**: Manager creation form fields validation
- [ ] **Logic Test**: MGR-001 ID generation (should be MGR-001 since data cleared)
- [ ] **Database Test**: Manager properly stored in managers table
- [ ] **Activity Test**: User creation activity logged properly
- [ ] **Metrics Test**: User count increases from 0 to 1
- [ ] **Directory Test**: Manager appears in admin directory
- [ ] **Profile Test**: Manager can access their profile/dashboard

#### Expected Manager Flow
1. Admin → Create → Manager Tab
2. Fill required fields (name, email, phone, etc.)
3. Submit form
4. Verify success message
5. Check admin dashboard shows +1 user
6. Check activity log shows creation
7. Test manager login/access

### Phase 2: Contractor Creation & Validation 📋 PENDING
**Depends on**: Phase 1 completion

#### Contractor Creation Checklist
- [ ] **UI Test**: Contractor creation form fields validation
- [ ] **Logic Test**: CON-001 ID generation
- [ ] **Database Test**: Contractor stored properly
- [ ] **Activity Test**: Creation logged
- [ ] **Metrics Test**: User count increases to 2
- [ ] **Directory Test**: Contractor appears in listings
- [ ] **Profile Test**: Contractor access validation

### Phase 3: Manager-Contractor Assignment 🔗 PENDING
**Depends on**: Phase 1 & 2 completion

#### Assignment Logic Checklist
- [ ] **Assignment Flow**: Admin can assign contractor to manager
- [ ] **Database Update**: cks_manager field updated in contractors table
- [ ] **UI Reflection**: Assignment shows in both manager and contractor views
- [ ] **Access Control**: Manager can see assigned contractors
- [ ] **Contractor View**: Contractor sees assigned manager info
- [ ] **Activity Logging**: Assignment activity recorded
- [ ] **Unassignment**: Can unassign/reassign contractors

---

## User Type Testing Matrix

### 🏢 Manager Hub Testing
| Feature | Creation | Profile | Dashboard | Directory | Assignment View | Status |
|---------|----------|---------|-----------|-----------|----------------|--------|
| MGR-001 | 🟡 Testing | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | IN PROGRESS |

### 🔧 Contractor Hub Testing  
| Feature | Creation | Profile | Dashboard | Directory | Manager Link | Status |
|---------|----------|---------|-----------|-----------|-------------|--------|
| CON-001 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | PENDING |

### 👥 Customer Hub Testing
| Feature | Creation | Profile | Dashboard | Directory | Contractor Link | Status |
|---------|----------|---------|-----------|-----------|----------------|--------|
| CUS-001 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | NOT STARTED |

### 🏪 Center Hub Testing
| Feature | Creation | Profile | Dashboard | Directory | Management | Status |
|---------|----------|---------|-----------|-----------|------------|--------|
| CEN-001 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | NOT STARTED |

### 👷 Crew Hub Testing
| Feature | Creation | Profile | Dashboard | Directory | Assignments | Status |
|---------|----------|---------|-----------|-----------|-------------|--------|
| CRW-001 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | NOT STARTED |

### 📦 Warehouse Hub Testing
| Feature | Creation | Profile | Dashboard | Inventory | Orders | Status |
|---------|----------|---------|-----------|-----------|---------|--------|
| WHS-001 | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | ⏳ Pending | NOT STARTED |

---

## Critical Logic Flows to Test

### 🎯 Primary Assignment Chains
1. **Manager → Contractor Assignment**
   - Status: 🟡 In Progress (creating MGR-001)
   - Key Logic: cks_manager field update, bidirectional visibility

2. **Manager → Customer Assignment** 
   - Status: ⏳ Pending
   - Key Logic: Manager can see assigned customers, service management

3. **Contractor → Customer Assignment**
   - Status: ⏳ Pending  
   - Key Logic: Service delivery chain, contractor customer access

4. **Center → Crew Assignment**
   - Status: ⏳ Pending
   - Key Logic: Location-based crew management

5. **Multi-level Dependencies**
   - Status: ⏳ Pending
   - Key Logic: Manager → Contractor → Customer chain validation

### 🔐 Authentication & Access Control
- [ ] Role-based dashboard access
- [ ] Cross-hub visibility rules
- [ ] Assignment-based permissions
- [ ] Admin override capabilities

### 📊 Data Consistency Checks
- [ ] ID generation sequence integrity
- [ ] Foreign key relationships
- [ ] Activity logging completeness
- [ ] Metrics accuracy across operations
- [ ] Archive system functionality

---

## Known Issues & Fixes Applied

### ✅ Resolved Issues
1. **Archive System**: Fixed archived users showing in directory after refresh
2. **User Metrics**: Fixed user count not decreasing when archived
3. **Activity Logging**: Fixed restore activities not appearing
4. **Archive Date Display**: Fixed missing archived date in Archive tab
5. **Database Connection**: Upgraded Render PostgreSQL plan to resolve connection issues
6. **Hard Delete**: Added permanent delete functionality to archive
7. **Activity Management**: Added clear activity functionality

### 🔍 Areas Requiring Testing
1. **Cross-Hub Navigation**: User switching between hubs
2. **Assignment Propagation**: Changes reflecting across related users
3. **Permission Boundaries**: Access restrictions working properly
4. **Data Validation**: Form validation and error handling
5. **Session Management**: Login/logout/profile switching

---

## Testing Environment Details

### 🖥️ Current Setup
- **Frontend**: http://localhost:5183 (Vite dev server)
- **Backend**: http://localhost:5000 (Express API server)  
- **Database**: Render PostgreSQL Basic Plan
- **Authentication**: Clerk (configured for dev)

### 📋 Pre-Testing Checklist
- [x] Backend server running on port 5000
- [x] Frontend server running on port 5183
- [x] Database connection active
- [x] All users cleared (clean slate)
- [x] All activity history cleared
- [x] Archive system functional

### 🧪 Testing Approach
1. **Create user via Admin panel**
2. **Verify database storage**
3. **Check activity logging**  
4. **Test user hub access**
5. **Validate UI consistency**
6. **Test assignment flows**
7. **Verify cross-hub visibility**

---

## Next Agent Instructions

### 🎯 Current Priority
**User is creating MGR-001** - Support this process and document any issues found.

### 📝 When User Reports Back
1. **Document findings** in the relevant testing matrix above
2. **Update status** from 🟡 Testing to ✅ Passed or ❌ Failed  
3. **Note any issues** in the Known Issues section
4. **Proceed to next phase** based on results

### 🔄 Workflow Continuation
If MGR-001 creation successful → Move to Phase 2 (Contractor Creation)
If issues found → Address issues before proceeding
Document all findings in this document for continuity

### 📚 Reference Documents
- Main README: `../README.md`
- API Documentation: Backend server `/api/docs`
- Database Schema: `../Database/migrations/`
- Testing Credentials: `./TESTING_CREDENTIALS.md`

---

## Change Log

### 2025-09-07
- **Created** comprehensive testing workflow documentation
- **Cleared** all user data and activity for fresh testing start
- **Implemented** complete archive system with hard delete
- **Added** activity clearing functionality
- **Ready** for MGR-001 creation testing phase

---

*This document should be updated by each agent as testing progresses to maintain continuity and comprehensive test coverage.*