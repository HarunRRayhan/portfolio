import type { SeoPayload } from '@/Components/SeoHead'

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    profile_slug: string;
    anonymous: boolean;
    anon_name: string | null;
    bio: string | null;
    avatar_url: string | null;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        isAdmin: boolean;
        user: User;
        xp?: number | null;
    };
    seo?: SeoPayload | null;
    canonicalUrl?: string;
};
