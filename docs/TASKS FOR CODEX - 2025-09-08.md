Based on the document you shared, I can see exactly why Codex is struggling. The core issue is that Codex keeps partially fixing the problem but missing the complete solution. Here's what's happening:
The Real Problem

Activities ARE being logged - but with mismatched user_id/target_id values
Frontend IS fetching - but the backend query doesn't return the right rows
Case sensitivity - The contractor hub often uses lowercase IDs (con-001) while activities are logged with uppercase (CON-001)

Why Codex Keeps Failing
Looking at the conversation, Codex identified the issues correctly multiple times but kept implementing incomplete fixes:

First attempt: Added welcome_message logging but didn't ensure the contractor activity endpoint would return it
Second attempt: Tried case-insensitive matching but reverted it
Third attempt: Added contractor-targeted events but they're still not showing

The fundamental disconnect is between:

How activities are logged (user_id field in database)
How they're queried (the endpoint expects specific target_id/target_type)
How IDs are passed (frontend may use lowercase, backend expects uppercase)

The Complete Fix Needed
Here's a comprehensive prompt that addresses ALL the issues:
markdown# CKS Portal - Complete Fix for Contractor Activity Logging

## THE COMPLETE PROBLEM
1. Activities are logged but contractor hub shows "No recent activity"
2. Manager hub WORKS, contractor hub DOESN'T
3. Case sensitivity issues: frontend uses 'con-001', backend logs 'CON-001'

## EXACT FIXES REQUIRED

### 1. Fix the Backend Query - `/backend/server/hubs/contractor/routes.ts`

Find the `/activity` endpoint and make it EXACTLY like the working manager one:

```typescript
router.get('/activity', async (req, res) => {
  const { code } = req.query;
  
  // CRITICAL: Normalize to uppercase for matching
  const contractorId = String(code || '').toUpperCase();
  
  if (!contractorId) {
    return res.json([]);
  }
  
  try {
    // Query activities WHERE target_id matches (case-insensitive)
    const result = await req.db.query(`
      SELECT * FROM system_activity 
      WHERE UPPER(target_id) = $1 
      AND target_type = 'contractor'
      ORDER BY created_at DESC 
      LIMIT 50
    `, [contractorId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Contractor activity fetch error:', error);
    res.json([]);
  }
});
2. Fix Activity Logging - When Creating Contractor
In /backend/server/hubs/admin/routes.ts, in the contractor creation section:
typescript// When creating contractor
const contractor_id = await getNextIdGeneric('contractors', 'contractor_id', 'CON-');

// Log TWO activities:
// 1. Admin activity (for admin hub)
await logActivity(
  'user_created',
  `New Contractor Created: ${contractor_id} (${company})`,
  'admin',
  'admin',
  'admin', // target_id for admin
  'admin',  // target_type
  { contractor_id }
);

// 2. Contractor welcome (for contractor hub) - THIS IS CRITICAL
await logActivity(
  'welcome_message',
  `Welcome to your CKS Portal account, ${company}! Your user ID is ${contractor_id}.`,
  contractor_id, // actor_id - who initiated
  'contractor',  // actor_type
  contractor_id, // target_id - THIS MUST MATCH what the query looks for
  'contractor',  // target_type - THIS MUST BE 'contractor'
  { is_welcome: true }
);
3. Fix Activity Logging - When Assigning to Manager
In the assign-manager endpoint:
typescriptrouter.post('/contractors/:id/assign-manager', async (req, res) => {
  const contractorId = req.params.id.toUpperCase(); // Normalize
  const { managerId } = req.body;
  
  // Update assignment
  await req.db.query(
    'UPDATE contractors SET cks_manager = $1 WHERE contractor_id = $2',
    [managerId, contractorId]
  );
  
  // Log THREE activities:
  
  // 1. Admin activity
  await logActivity(
    'assignment_made',
    `Assigned ${contractorId} to ${managerId}`,
    'admin',
    'admin',
    'admin',
    'admin',
    { contractor_id: contractorId, manager_id: managerId }
  );
  
  // 2. Manager activity (THIS WORKS - that's why managers see activities)
  await logActivity(
    'contractor_assigned',
    `You have been assigned a new contractor: ${contractorId}`,
    'admin',
    'admin',
    managerId,  // target_id matches manager
    'manager',  // target_type
    { contractor_id: contractorId }
  );
  
  // 3. Contractor activity (THIS IS WHAT'S MISSING)
  await logActivity(
    'manager_assigned',
    `You have been assigned to manager ${managerId}`,
    'admin',
    'admin',
    contractorId,  // target_id MUST be the contractor ID
    'contractor',  // target_type MUST be 'contractor'
    { manager_id: managerId }
  );
});
4. Verify Frontend is Passing Code Correctly
In /frontend/src/pages/Hub/Contractor/Home.tsx, ensure:
typescript// The code should be uppercase when fetching
const fetchActivities = async () => {
  const code = rawCode.toUpperCase(); // Ensure uppercase
  const url = `${baseApi}/contractor/activity?code=${code}`;
  
  const response = await fetch(url);
  const data = await response.json();
  setActivities(data);
};
TEST VERIFICATION
After implementing, check the database directly:
sql-- Check what's actually in the database
SELECT target_id, target_type, action_type, description 
FROM system_activity 
WHERE UPPER(target_id) LIKE 'CON-%' 
ORDER BY created_at DESC;
You should see:

welcome_message with target_id='CON-XXX' and target_type='contractor'
manager_assigned with target_id='CON-XXX' and target_type='contractor'

WHY MANAGER WORKS BUT CONTRACTOR DOESN'T
Manager works because:

Manager IDs are consistently uppercase (MGR-001)
Manager activities ARE being logged with correct target_id/target_type
Manager endpoint queries correctly

Contractor doesn't work because:

Case mismatch between frontend (con-001) and backend (CON-001)
Activities weren't being logged with contractor as target_id/target_type
Query wasn't case-insensitive

This fix ensures BOTH proper logging AND proper querying.

The key insight is that Codex kept fixing one part (logging OR querying) but not both together, and didn't account for the case sensitivity issue comprehensively. The manager hub works because it's doing all three things correctly - this fix makes contractor hub match that pattern exactly.