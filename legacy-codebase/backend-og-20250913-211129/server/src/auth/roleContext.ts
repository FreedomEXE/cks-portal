import { Request, Response, NextFunction } from 'express';

export function roleContext(req: Request, _res: Response, next: NextFunction) {
  // Attach the role from URL param so downstream routers and logs can use it
  const role = (req.params as any)?.role?.toLowerCase?.() || null;
  (req as any).context = { ...(req as any).context, role };
  next();
}

