/**
 * File: authenticate.ts
 *
 * Description: Core authentication module - JWT verification and user enrichment
 * Function: Shared authentication logic for all roles
 * Importance: Single source of auth truth for entire backend
 * Connects to: Database users/permissions, JWT verification, capability computation
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
            context?: {
                role: string;
                domain?: string;
                ecosystem?: {
                    contractorId?: string;
                    managerId?: string;
                    customerId?: string;
                    centerId?: string;
                    warehouseId?: string;
                };
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
 * Development helper: mock authentication for testing
 */
export declare function mockAuth(userId: string, roleCode: string, capabilities?: string[]): (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=authenticate.d.ts.map