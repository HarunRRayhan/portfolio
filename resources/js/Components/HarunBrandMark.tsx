import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'

export function HarunBrandMark({ className, ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      alt=""
      width={400}
      height={400}
      {...rest}
      src={getImageUrl('/images/profile/harun-bio.jpg')}
      className={cn('block rounded-[22%] object-cover', className)}
    />
  )
}
