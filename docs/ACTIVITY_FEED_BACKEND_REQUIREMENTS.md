# Activity Feed Backend Requirements

## Overview
Phase 4 Activity Feed enhancements require backend support for clearing individual activities and viewing activity history.

## Database Schema Changes

### Add `clearedAt` field to activities table
```sql
ALTER TABLE activities ADD COLUMN cleared_at TIMESTAMP NULL;
ALTER TABLE activities ADD COLUMN cleared_by VARCHAR(255) NULL;
```

## API Endpoints Needed

### 1. Clear Individual Activity
**POST** `/api/activities/:activityId/clear`

**Request Body:**
```json
{
  "userId": "MGR-001"
}
```

**Response:**
```json
{
  "success": true,
  "activityId": "act-123",
  "clearedAt": "2025-10-20T14:30:00Z"
}
```

**Logic:**
- Update activity record: `cleared_at = NOW(), cleared_by = userId`
- Only affect this user's view (user-specific)
- Don't actually delete the activity

### 2. Clear All Activities
**POST** `/api/activities/clear-all`

**Request Body:**
```json
{
  "userId": "MGR-001",
  "filters": {
    "targetType": "order", // optional: "all", "order", "service", "report", etc.
    "userId": "CUST-001"   // optional: filter by activity creator
  }
}
```

**Response:**
```json
{
  "success": true,
  "clearedCount": 15
}
```

**Logic:**
- Apply filters to determine which activities to clear
- Update all matching activities with `cleared_at` and `cleared_by`
- Respect type and user filters

### 3. Get Activity History (Last 30 Days)
**GET** `/api/activities/history?userId=MGR-001&days=30`

**Query Params:**
- `userId` (required): Current user
- `days` (optional, default=30): How many days of history

**Response:**
```json
{
  "activities": [
    {
      "id": "act-123",
      "message": "Order ORD-001 created",
      "timestamp": "2025-10-20T10:00:00Z",
      "type": "info",
      "metadata": {
        "role": "customer",
        "userId": "CUST-001",
        "userName": "John Doe",
        "targetType": "order",
        "targetId": "ORD-001"
      },
      "clearedAt": "2025-10-20T14:00:00Z",
      "clearedBy": "MGR-001"
    }
  ]
}
```

**Logic:**
- Return ALL activities from last N days
- Include both cleared and not-cleared activities
- Include `clearedAt` and `clearedBy` fields
- Sort by timestamp descending (newest first)

## Frontend Integration

### Activity Interface Enhancement
```typescript
export interface Activity {
  id: string;
  message: string;
  timestamp: Date;
  type?: 'info' | 'success' | 'warning' | 'action';
  onClick?: () => void;
  onClear?: () => void;
  metadata?: {
    role?: string;
    userId?: string;
    userName?: string;
    targetType?: string; // 'order', 'service', 'report', 'feedback'
    targetId?: string;
    [key: string]: any;
  };
  clearedAt?: string | null; // Backend timestamp
  clearedBy?: string | null; // Backend user ID
}
```

### Frontend Data Fetching

#### Current Activities (not cleared)
```typescript
const { data: activities } = useSWR('/api/activities?userId=MGR-001&cleared=false');
```

#### Activity History (including cleared)
```typescript
const { data: history } = useSWR('/api/activities/history?userId=MGR-001&days=30');
```

## Implementation Priority

**Phase 4A (MVP) - Frontend Complete, Backend Pending:**
- ✅ Filter bar UI (Type & User)
- ✅ Individual clear X buttons (UI only)
- ✅ Clear All button (UI only)
- ✅ View History button (UI only)
- ⏳ Activity History Modal (In Progress)

**Phase 4B - Backend Required:**
- POST /activities/:id/clear
- POST /activities/clear-all
- GET /activities/history

**Phase 4C - Wire Up:**
- Connect clear handlers to backend
- Implement optimistic updates
- Add loading states

## Notes

- Activities are user-specific "notifications", not entity modifications
- Clearing an activity doesn't delete it - just marks as viewed/cleared
- History view shows last 30 days (configurable)
- Cleared items shown with visual dimming (50% opacity)
- Original entity archiving (orders/services) stays admin-only
