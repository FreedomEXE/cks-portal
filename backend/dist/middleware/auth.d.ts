/**
 * File: auth.ts
 *
 * Description: Authentication middleware for CKS Portal - JWT verification and user enrichment
 * Function: Authenticate requests and enrich with user context and capabilities
 * Importance: Required for all protected routes - implements RBAC system
 * Connects to: users/permissions tables, Clerk JWT validation, role capabilities
 *
 * Notes: Complete authentication middleware with capability-based authorization
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                roleCode: string;
                capabilities: string[];
                sessionId?: string;
                metadata?: any;
            };
        }
    }
}
/**
 * Main authentication middleware
 * Validates JWT, loads user from database, and computes capabilities
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<any>;
/**
 * Optional middleware for role-specific authentication
 */
export declare function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => any;
/**
 * Development helper: mock authentication for testing
 */
export declare function mockAuth(userId: string, roleCode: string, capabilities?: string[]): (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=auth.d.ts.map