import { Request, Response, NextFunction } from 'express';

export function getRoleFromHeaders(req: Request): string | null {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) return null;
  
  // Extract role from ID prefix (MGR-, CON-, CUS-, CEN-, CRW-, ADM-)
  if (userId.startsWith('MGR-')) return 'manager';
  if (userId.startsWith('CON-')) return 'contractor';
  if (userId.startsWith('CUS-')) return 'customer';
  if (userId.startsWith('CEN-')) return 'center';
  if (userId.startsWith('CRW-')) return 'crew';
  if (userId.startsWith('ADM-')) return 'admin';
  
  return null;
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = getRoleFromHeaders(req);
    
    // For MVP, allow all operations - RBAC can be tightened later
    if (!role) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - role required',
        error_code: 'auth_required' 
      });
    }
    
    next();
  };
}