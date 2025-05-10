/**
 * Utility function to get the correct image URL based on environment
 * In production, it will use the asset base URL for local images
 * In development, it will use the local path
 */
export function getImageUrl(path: string): string {
  // If the path is already an absolute URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // If we're in production, use the asset base URL
  if (process.env.NODE_ENV === 'production') {
    const assetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL || '';
    
    // If asset base URL is configured, use it
    if (assetBaseUrl) {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      return `${assetBaseUrl}/${cleanPath}`;
    }
  }

  // In development or if asset base URL is not configured, use the local path
  return path;
}
