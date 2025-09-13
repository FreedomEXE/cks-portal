import { Router, Request, Response, NextFunction } from 'express';
import { getRoleRouter } from './roleRegistry';

// Router that dispatches to the appropriate role router based on :role
export default function createRoleMountRouter() {
  const router = Router({ mergeParams: true });

  router.use((req: Request, res: Response, next: NextFunction) => {
    const role = (req.params as any)?.role?.toLowerCase?.();
    const roleRouter = role ? getRoleRouter(role) : null;
    if (!roleRouter) {
      return res.status(404).json({ success: false, error: 'unknown_role', role });
    }
    // Delegate handling to the role router
    return (roleRouter as any)(req, res, next);
  });

  return router;
}

