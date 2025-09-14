/**
 * File: roleContext.ts
 *
 * Description: Role context middleware - extracts role from URL path and sets request context
 * Function: Parse /api/:role/* paths and attach role context to request
 * Importance: Enables role-scoped routing while maintaining shared domain logic
 * Connects to: Role routers, domain factories, audit logging
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Extract role from URL path and set request context
 * Used for /api/:role/* routes to identify which role hub is being accessed
 */
export declare function roleContext(req: Request, res: Response, next: NextFunction): any;
/**
 * Middleware to require specific role context
 */
export declare function requireRoleContext(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=roleContext.d.ts.map