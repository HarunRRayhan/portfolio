import type { SeoPayload } from '@/Components/SeoHead'

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    seo?: SeoPayload | null;
    canonicalUrl?: string;
};
