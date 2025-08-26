/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';

const router = express.Router();

// Helper to get user id from headers
function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-customer-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/customer/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sample = {
      customer_id: userId || 'CUS-000',
      customer_name: 'Customer Demo Corp',
      cks_manager: 'MGR-001',
      email: 'customer@demo.com',
      phone: '(555) 222-3344',
      address: '100 Customer Way',
      status: 'Active'
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Customer profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer profile', error_code: 'server_error' });
  }
});

// GET /api/customer/centers
router.get('/centers', async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || 'CUS-000');
    const data = [
      { id: 'CEN-001', name: 'Downtown Office Complex', location: 'Downtown', status: 'Active', crew_count: 3, last_service: '2025-08-22' },
      { id: 'CEN-002', name: 'North District Plaza', location: 'North District', status: 'Active', crew_count: 2, last_service: '2025-08-21' }
    ];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Customer centers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer centers', error_code: 'server_error' });
  }
});

// GET /api/customer/requests
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 5);
    const data = [
      { id: 'REQ-001', center: 'Downtown Office Complex', type: 'Cleaning', priority: 'High', status: 'Open', date: '2025-08-23' },
      { id: 'REQ-002', center: 'North District Plaza', type: 'Maintenance', priority: 'Medium', status: 'In Progress', date: '2025-08-22' },
      { id: 'REQ-003', center: 'West Side Mall', type: 'Security', priority: 'Low', status: 'Completed', date: '2025-08-21' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Customer requests endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customer requests', error_code: 'server_error' });
  }
});

export default router;

