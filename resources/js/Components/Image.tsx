import React from 'react';
import { getImageUrl } from '../lib/imageUtils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Image component that automatically uses CDN URLs in production
 * This is a drop-in replacement for the standard img element
 */
export function Image({ src, alt, className, ...props }: ImageProps) {
  const imageUrl = getImageUrl(src);
  
  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={className}
      {...props}
    />
  );
}
