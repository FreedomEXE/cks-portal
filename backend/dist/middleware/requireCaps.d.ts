/**
 * File: requireCaps.ts
 *
 * Description: Capability-based authorization middleware for CKS Portal
 * Function: Enforce RBAC checks by validating user capabilities
 * Importance: Protects sensitive endpoints and aligns with UI permission gating
 * Connects to: auth.ts (req.user.capabilities), Manager route modules
 *
 * Notes: Works with auth.ts to provide fine-grained permission control
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Middleware factory that creates capability requirement middleware
 * @param requiredCaps - Array of capability codes that user must have
 * @param mode - 'all' (default) requires all capabilities, 'any' requires at least one
 */
export declare function requireCaps(...requiredCaps: string[]): (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Alternative capability check - requires ANY of the capabilities (OR logic)
 */
export declare function requireAnyCap(...requiredCaps: string[]): (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Check capabilities without middleware (for programmatic use)
 */
export declare function checkCaps(userCaps: string[], requiredCaps: string[]): boolean;
/**
 * Check if user has any of the specified capabilities
 */
export declare function checkAnyCap(userCaps: string[], requiredCaps: string[]): boolean;
/**
 * Get missing capabilities for a user
 */
export declare function getMissingCaps(userCaps: string[], requiredCaps: string[]): string[];
/**
 * Middleware to require specific role (convenience wrapper)
 */
export declare function requireRole(role: string): (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Development helper to bypass capability checks
 */
export declare function bypassAuth(): (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=requireCaps.d.ts.map