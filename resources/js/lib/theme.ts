import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

// The boot script in app.blade.php applies the stored choice before paint and tracks OS changes.
export function getTheme(): Theme {
    try {
        const t = localStorage.getItem('theme')
        return t === 'light' || t === 'dark' ? t : 'system'
    } catch {
        return 'system'
    }
}

export function setTheme(theme: Theme) {
    try {
        if (theme === 'system') localStorage.removeItem('theme')
        else localStorage.setItem('theme', theme)
    } catch {
        // Private mode: the choice still applies for this page view.
    }
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
    window.dispatchEvent(new Event('themechange'))
}

/** True when the dark class is on <html>. False during SSR. */
export function useIsDark(): boolean {
    const [dark, setDark] = useState(false)
    useEffect(() => {
        const sync = () => setDark(document.documentElement.classList.contains('dark'))
        sync()
        window.addEventListener('themechange', sync)
        return () => window.removeEventListener('themechange', sync)
    }, [])
    return dark
}
