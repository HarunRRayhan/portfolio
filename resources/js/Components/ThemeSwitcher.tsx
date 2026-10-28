import { useEffect, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
] as const

export function ThemeSwitcher() {
    const [theme, setLocal] = useState<Theme>('system')
    useEffect(() => setLocal(getTheme()), [])

    return (
        <div role="radiogroup" aria-label="Theme" className="inline-flex items-center gap-0.5 rounded-lg border border-slate-700 bg-slate-800/60 p-0.5">
            {options.map(({ value, label, icon: Icon }) => (
                <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={theme === value}
                    aria-label={label}
                    title={label}
                    onClick={() => {
                        setTheme(value)
                        setLocal(value)
                    }}
                    className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                        theme === value ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white',
                    )}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    )
}
