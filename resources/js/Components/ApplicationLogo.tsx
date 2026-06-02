import { getImageUrl } from "../lib/imageUtils"
import type { ComponentPropsWithoutRef } from 'react'

export default function ApplicationLogo(props: ComponentPropsWithoutRef<'img'>) {
    const { className, ...rest } = props

    return (
        <img
            {...rest}
            className={className}
            src={getImageUrl('/images/brand/harun-logo.svg')}
            alt="Harun logo"
        />
    )
}
