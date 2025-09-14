import { UserProfile } from './types';
export declare function getUserProfile(userId: string): Promise<UserProfile | null>;
export declare function updateUserProfile(userId: string, updates: Partial<Pick<UserProfile, 'user_name' | 'email' | 'template_version'>>): Promise<UserProfile | null>;
//# sourceMappingURL=repository.d.ts.map