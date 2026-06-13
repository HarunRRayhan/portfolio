import type { ComponentPropsWithoutRef } from 'react'
import { HarunBrandMark } from './HarunBrandMark'

export default function ApplicationLogo(props: ComponentPropsWithoutRef<'svg'>) {
    const { className, ...rest } = props

    return <HarunBrandMark {...rest} className={className} />
}
