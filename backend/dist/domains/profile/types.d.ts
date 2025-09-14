export interface UserProfile {
    user_id: string;
    user_name: string;
    email: string | null;
    role_code: string;
    template_version: string | null;
    created_at: string | Date;
    archived: boolean;
}
export interface ProfileRouteConfig {
    capabilities: {
        view: string;
        update?: string;
        admin?: string;
    };
    features: {
        basicInfo: boolean;
        contactInfo?: boolean;
        preferences?: boolean;
        security?: boolean;
        systemSettings?: boolean;
    };
    scope: 'global' | 'ecosystem' | 'entity';
    roleCode: string;
}
//# sourceMappingURL=types.d.ts.map