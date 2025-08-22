import express, { Request, Response } from 'express';

const router = express.Router();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Determines user role based on user ID prefix or Clerk mapping
 */
const CLERK_ID_MAPPING: Record<string, string> = {
  'user_31RUgYZKtWjKZFX9xo9xhdvd5E': 'CUS-000', // Example test customer
  // Add more mappings as needed
};

function getUserRole(userId: string): string | null {
  // Clerk mapping: if userId is a Clerk ID, map to CKS ID
  if (userId.startsWith('user_')) {
    const mappedId = CLERK_ID_MAPPING[userId];
    if (mappedId) {
      userId = mappedId;
      console.log(`[Clerk mapping] ${userId} -> ${mappedId}`);
    } else {
      console.warn(`[Clerk] No mapping for ${userId}`);
      return 'customer'; // Default for unmapped Clerk users
    }
  }

  const upperUserId = userId.toUpperCase();

  // Admin check first (highest priority)
  // Allow any custom admin name (no prefix required)
  if (
    upperUserId === 'FREEDOM_EXE' ||
    upperUserId === 'FREEDOMEXE' ||
    upperUserId.includes('ADMIN')
  ) {
    return 'admin';
  }

  // Enforce prefix for all other roles
  if (upperUserId.startsWith('MGR-')) return 'manager';
  if (upperUserId.startsWith('CUS-')) return 'customer';
  if (upperUserId.startsWith('CON-')) return 'contractor';
  if (upperUserId.startsWith('CEN-')) return 'center';
  if (upperUserId.startsWith('CRW-')) return 'crew';

  // If not admin and no valid prefix, treat as unknown
  return null;
}

/**
 * Formats user display name from user ID
 */
function formatDisplayName(userId: string): string {
  return userId
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace('EXE', '')
    .trim();
}

// ============================================
// MAIN ENDPOINTS
// ============================================

/**
 * GET /me/profile
 * Returns the current user's profile based on x-user-id header
 */
router.get('/me/profile', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'FREEDOM_EXE');

    // === TEMPORARY OVERRIDE FOR TEMPLATE TESTING ===
    // To test templates, you can force any role here:
    // Change 'customer' to 'manager', 'contractor', 'crew', 'center', etc. as needed
    
    const overrideRole = req.query.role || 'customer';
    return res.json({
      id: userId,
      code: userId,
      role: overrideRole,
      name: formatDisplayName(userId),
      email: `${userId.toLowerCase().replace(/_/g, '.')}@cks-portal.com`,
      is_active: true,
      created_at: new Date().toISOString(),
      _source: 'OVERRIDE',
    });
    // === END TEMPORARY OVERRIDE ===
  } catch (error: any) {
    console.error('[/me/profile] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
});

/**
 * GET /me
 * Alias endpoint for basic user info (forwards to /me/profile)
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || 'FREEDOM_EXE');
    const role = getUserRole(userId);
    
    if (!role) {
      console.warn(`[/me] Unknown user type: ${userId}`);
      return res.status(400).json({ 
        error: `Unknown user type: ${userId}` 
      });
    }

    console.log(`[/me] User: ${userId} | Role: ${role}`);

    // Return simplified user data
    return res.json({
      id: userId,
      code: userId,
      role: role,
      name: formatDisplayName(userId),
    });
  } catch (error: any) {
    console.error('[/me] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user info',
      message: error.message 
    });
  }
});

/**
 * GET /me/manager
 * Legacy endpoint for manager validation
 * TODO: Deprecate this in favor of role-based checks
 */
router.get('/me/manager', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    const role = getUserRole(userId);
    
    // Verify manager role
    if (role !== 'manager' && role !== 'admin') {
      return res.status(404).json({ 
        error: 'Not a manager',
        current_role: role 
      });
    }
    
    return res.json({
      manager_id: userId,
      name: formatDisplayName(userId),
      role: 'manager',
    });
  } catch (error: any) {
    console.error('[/me/manager] Error:', error);
    return res.status(500).json({ 
      error: 'Manager check failed',
      message: error.message 
    });
  }
});

/**
 * GET /me/bootstrap
 * Checks if user account is linked/initialized
 */
router.get('/me/bootstrap', async (req: Request, res: Response) => {
  try {
    const userId = String(req.headers['x-user-id'] || '');
    
    if (!userId) {
      return res.json({ 
        linked: false,
        message: 'No user ID provided' 
      });
    }
    
    // TODO: Implement actual database lookup
    // For now, return unlinked to show onboarding flow
    return res.json({ 
      linked: false,
      user_id: userId,
      note: 'Database integration pending' 
    });
  } catch (error: any) {
    console.error('[/me/bootstrap] Error:', error);
    return res.status(500).json({ 
      linked: false,
      error: error.message 
    });
  }
});

// ============================================
// PLACEHOLDER ENDPOINTS
// TODO: Remove these once frontend is updated
// ============================================

router.get('/services', async (_req: Request, res: Response) => {
  return res.json({ items: [], total: 0 });
});

router.get('/jobs', async (_req: Request, res: Response) => {
  return res.json({ items: [], total: 0 });
});

router.get('/reports', async (_req: Request, res: Response) => {
  return res.json({ items: [], total: 0 });
});

router.get('/profile', async (req: Request, res: Response) => {
  const userId = String(req.headers['x-user-id'] || '');
  if (!userId) {
    return res.json({ profile: null });
  }
  return res.json({ 
    profile: { 
      id: userId, 
      name: formatDisplayName(userId), 
      role: getUserRole(userId) 
    } 
  });
});

export default router;