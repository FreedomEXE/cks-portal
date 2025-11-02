# GPT-5 Prompt: Document the Activity Feed System

## Task
Analyze the codebase and create comprehensive documentation for how the Activity Feed system works, including how activities are created, formatted, personalized, and displayed across different roles.

## Investigation Areas

### 1. Backend Activity Creation
**Files to examine:**
- `apps/backend/server/domains/activity/writer.ts` - recordActivity function
- `apps/backend/server/domains/orders/store.ts` - order_created activity (line ~1911)
- `apps/backend/server/domains/catalog/routes.fastify.ts` - certification activities (line ~484)
- `apps/backend/server/domains/archive/store.ts` - archive/delete activities
- `apps/backend/server/domains/assignments/store.ts` - assignment activities

**Questions:**
1. What is the standard format for activity descriptions?
2. Do descriptions include actor information (role/ID) or just the action?
3. What metadata is captured with each activity?
4. Are there any personalization rules applied at creation time?

### 2. Backend Activity Personalization
**Files to examine:**
- `apps/backend/server/domains/scope/store.ts` - mapActivityRow function (line ~149)
- Specifically lines 149-194 showing personalization logic

**Questions:**
1. Which activity types get personalized descriptions?
2. How does the personalization work (viewer-based, actor-based, etc.)?
3. What are the rules for:
   - Certification activities (lines 152-168)
   - Catalog creation events (lines 170-180)
   - Order creation/updates
   - Assignment activities
4. Should ALL activities be personalized or just specific types?

### 3. Frontend Activity Display
**Files to examine:**
- `packages/domain-widgets/src/activity/RecentActivity/ActivityItem.tsx`
- `packages/domain-widgets/src/activity/RecentActivity/RecentActivity.tsx`
- `apps/frontend/src/components/ActivityFeed.tsx`
- `apps/frontend/src/shared/api/directory.ts` - mapActivities function (line ~327)

**Questions:**
1. How does the UI display activity information?
2. What is the role-based color coding system?
3. Is there any frontend transformation of activity descriptions?
4. How does the Activity interface work (message, timestamp, type, metadata)?

### 4. Role-Specific Activity Scoping
**Files to examine:**
- `apps/backend/server/domains/scope/store.ts` - getRoleActivities function
- Individual role activity functions: getCrewActivities, getManagerActivities, etc.

**Questions:**
1. What activities does each role see?
2. How are activities filtered per role?
3. What are the ecosystem/scope rules for activity visibility?

## Deliverable

Create a comprehensive markdown document at `docs/architecture/activity-feed-system.md` that includes:

### Section 1: System Overview
- High-level architecture diagram (text-based)
- Activity lifecycle (creation → personalization → filtering → display)
- Key principles and design decisions

### Section 2: Activity Creation
- Standard format for activity descriptions
- Required fields (activityType, description, actorId, actorRole, targetId, targetType, metadata)
- Best practices for writing activity descriptions
- Examples of good vs bad descriptions

### Section 3: Activity Personalization Rules
- Complete list of personalized activity types
- Personalization logic for each type
- When to personalize vs use canonical descriptions
- Examples showing canonical vs personalized versions

### Section 4: Role-Based Visibility
- Matrix showing which roles see which activity types
- Scoping rules (ecosystem, metadata filters, etc.)
- Special cases (admin sees all, certifications only show to affected user, etc.)

### Section 5: Frontend Display
- How ActivityFeed component works
- Role-based color coding system
- Activity card structure and styling
- Click handlers and modal routing

### Section 6: Adding New Activity Types
- Step-by-step guide for adding a new activity type
- Checklist of files to update
- Testing considerations
- Common pitfalls to avoid

### Section 7: Examples & Patterns
- Common activity patterns (creation, assignment, certification, archive/delete)
- Complete examples showing backend creation → frontend display
- Role-specific examples (what each role sees for the same activity)

## Context

**Current Issue:**
The CTO was confused about whether activity descriptions include actor role prefixes (like "Admin Certified..." vs "Certified..."). The visual design uses role-based color coding which creates a visual association with the role, but the description itself may not include the actor.

**Key Requirements from CTO:**
1. IDs should NOT be in the activity message (actor info shows who did it)
2. Messages should be personalized per viewer when appropriate
3. The visual design (color coding) helps indicate who performed the action

**Analysis Needed:**
- Determine if activity descriptions SHOULD include actor role/ID or if the color coding is sufficient
- Document the current behavior vs intended behavior
- Provide recommendations for consistency across all activity types

## Output Format

Save the documentation to: `docs/architecture/activity-feed-system.md`

Use clear markdown formatting with:
- Headers for each major section
- Code examples in fenced code blocks with language tags
- Tables for matrices and comparisons
- Bullet points for lists
- Emphasis (**bold**) for important concepts
- Links to relevant source files

Include a "Last Updated" timestamp and version number at the top of the document.
