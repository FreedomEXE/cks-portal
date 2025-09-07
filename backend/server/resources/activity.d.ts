declare const router: import("express-serve-static-core").Router;
export declare function logActivity(activity_type: string, description: string, actor_id?: string, actor_role?: string, target_id?: string, target_type?: string, metadata?: any): Promise<void>;
export default router;
