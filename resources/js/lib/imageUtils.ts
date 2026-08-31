/**
 * Utility function to get the correct image URL based on environment.
 * In production, local media paths are served from the CDN (R2).
 * /build assets stay same-origin via the Laravel Vite manifest — do not use this for JS/CSS.
 */
export function getImageUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  if (import.meta.env.PROD) {
    const assetBaseUrl =
      import.meta.env.VITE_ASSET_BASE_URL || 'https://cdn.harun.dev'

    if (assetBaseUrl) {
      const cleanPath = path.startsWith('/') ? path.substring(1) : path
      return `${assetBaseUrl.replace(/\/$/, '')}/${cleanPath}`
    }
  }

  return path
}
