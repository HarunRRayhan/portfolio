export const SITE_NAME = 'Harun R. Rayhan';

function resolveSiteName(siteName?: string): string {
    const brand = (siteName ?? '').trim();

    if (brand === '' || brand.toLowerCase() === 'laravel') {
        return SITE_NAME;
    }

    return brand;
}

export function resolveDocumentTitle(title: string, siteName?: string): string {
    const trimmed = title.trim();
    const brand = resolveSiteName(siteName);

    if (trimmed === '') {
        return brand;
    }

    if (
        trimmed === brand ||
        trimmed.includes(brand) ||
        trimmed.includes('|') ||
        trimmed.includes(' - ')
    ) {
        return trimmed;
    }

    const branded = `${trimmed} - ${brand}`;

    // Search results cut titles near 60 characters; a long title keeps its words, not the brand.
    return branded.length <= 60 ? branded : trimmed;
}
