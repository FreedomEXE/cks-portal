/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-manager-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/manager/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sample = {
      manager_id: userId || 'MGR-000',
      name: 'Manager Demo',
      role: 'Territory Manager',
      email: 'manager@demo.com',
      phone: '(555) 123-4567',
      territory: 'Demo Territory',
      status: 'Active'
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Manager profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch manager profile', error_code: 'server_error' });
  }
});

// GET /api/manager/news
router.get('/news', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 3);
    const data = [
      { id: 'mgr-news-001', title: 'Territory performance review scheduled for Q4', date: '2025-08-15' },
      { id: 'mgr-news-002', title: 'New contractor onboarding process updated', date: '2025-08-12' },
      { id: 'mgr-news-003', title: 'Center capacity reports now available', date: '2025-08-10' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Manager news endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch manager news', error_code: 'server_error' });
  }
});

export default router;

