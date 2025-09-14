/**
 * File: requireCaps.ts
 *
 * Description: Capability-based authorization middleware
 * Function: Guard endpoints by required capabilities
 * Importance: Ensures consistent permission enforcement across all domains
 * Connects to: authenticate.ts, user capabilities from database
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Require specific capabilities for endpoint access
 */
export declare function requireCaps(...requiredCaps: string[]): (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Require specific role (fallback for simple role-based checks)
 */
export declare function requireRole(...allowedRoles: string[]): (req: Request, res: Response, next: NextFunction) => any;
/**
 * Development bypass for testing (from existing middleware)
 */
export declare function bypassAuth(): (req: Request, res: Response, next: NextFunction) => any;
/**
 * Check if user has ecosystem access (contractor owns entities)
 */
export declare function requireEcosystemAccess(): (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=requireCaps.d.ts.map