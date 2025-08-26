/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import express, { Request, Response } from 'express';

const router = express.Router();

function getUserId(req: Request): string {
  const v = (req.headers['x-user-id'] || req.headers['x-contractor-user-id'] || '').toString();
  return String(v || '');
}

// GET /api/contractor/profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sample = {
      contractor_id: userId || 'CON-000',
      company_name: 'Contractor Demo LLC',
      account_manager: 'MGR-001',
      email: 'contact@contractor-demo.com',
      phone: '(555) 987-6543',
      address: '123 Business Ave, Suite 100',
      payment_status: 'Current',
      services_purchased: ['Cleaning', 'Maintenance']
    };
    return res.json({ success: true, data: sample });
  } catch (error) {
    console.error('Contractor profile endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor profile', error_code: 'server_error' });
  }
});

// GET /api/contractor/dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const data = [
      { label: 'Active Customers', value: 15, trend: '+3', color: '#3b7af7' },
      { label: 'Active Centers', value: 8, trend: '+2', color: '#8b5cf6' },
      { label: 'Account Status', value: 'Current', color: '#10b981' },
      { label: 'Services Used', value: 3, color: '#f59e0b' },
      { label: 'Active Crew', value: 12, trend: '+1', color: '#ef4444' },
      { label: 'Pending Orders', value: 4, color: '#f97316' }
    ];
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor dashboard endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor dashboard', error_code: 'server_error' });
  }
});

// GET /api/contractor/customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit || 5);
    const data = [
      { id: 'CUS-001', name: 'Metro Office Plaza', centers: 3, status: 'Active', last_service: '2025-08-22' },
      { id: 'CUS-002', name: 'Riverside Shopping Center', centers: 2, status: 'Active', last_service: '2025-08-21' },
      { id: 'CUS-003', name: 'Downtown Business Tower', centers: 4, status: 'Active', last_service: '2025-08-20' },
      { id: 'CUS-004', name: 'Suburban Medical Complex', centers: 1, status: 'Pending', last_service: '2025-08-15' },
      { id: 'CUS-005', name: 'Industrial Park West', centers: 2, status: 'Active', last_service: '2025-08-18' }
    ].slice(0, Math.max(1, Math.min(10, limit)));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Contractor customers endpoint error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch contractor customers', error_code: 'server_error' });
  }
});

export default router;

