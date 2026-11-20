import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'

export function HarunBrandMark({ className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      alt=""
      width={160}
      height={160}
      {...rest}
      src={getImageUrl('/images/profile/harun-bio-160.jpg')}
      className={cn('block rounded-[22%] object-cover', className)}
    />
  )
}
