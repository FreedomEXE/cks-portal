import { Response, Request, NextFunction } from 'express';
export declare function ok(res: Response, data?: any): void;
export declare function bad(res: Response, message?: string, code?: number): void;
export declare function safe(asyncHandler: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=http.d.ts.map