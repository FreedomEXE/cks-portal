import { UserProfile } from './types';
export declare function getSelfProfile(userId: string): Promise<UserProfile | null>;
export declare function updateSelfProfile(userId: string, updates: Partial<Pick<UserProfile, 'user_name' | 'email' | 'template_version'>>): Promise<UserProfile | null>;
//# sourceMappingURL=service.d.ts.map