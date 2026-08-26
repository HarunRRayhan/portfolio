export const SITE_NAME = 'Harun R. Rayhan';

export function resolveDocumentTitle(title: string, siteName = SITE_NAME): string {
    const trimmed = title.trim();
    const brand = siteName.trim() === '' ? SITE_NAME : siteName;

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

    return `${trimmed} - ${brand}`;
}
