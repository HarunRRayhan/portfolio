import { useEffect, useRef } from 'react'

function getCodeLanguage(code: HTMLElement): string {
  if (code.dataset.language) {
    return code.dataset.language.replace(/-/g, ' ')
  }

  const className = code.className || ''
  const match = className.match(/language-([a-z0-9-]+)/i) ?? className.match(/lang-([a-z0-9-]+)/i)

  if (!match?.[1]) {
    return 'code'
  }

  return match[1].replace(/-/g, ' ')
}

async function enhanceCodeBlocks(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll('pre'))

  if (blocks.length === 0) {
    return
  }

  const [{ default: hljs }] = await Promise.all([
    import('highlight.js/lib/common'),
    import('highlight.js/styles/github-dark.css'),
  ])

  blocks.forEach((pre) => {
    if (pre.dataset.enhanced === 'true') {
      return
    }

    const code = pre.querySelector('code')
    if (!(code instanceof HTMLElement)) {
      return
    }

    pre.dataset.enhanced = 'true'
    pre.classList.add('m-0', 'overflow-x-auto', 'bg-transparent', 'p-0')
    code.classList.add('bg-transparent', 'p-0')

    const langMatch =
      code.className.match(/language-([a-z0-9-]+)/i) ?? code.className.match(/lang-([a-z0-9-]+)/i)
    if (langMatch?.[1]) {
      code.dataset.language = langMatch[1]
    }

    try {
      hljs.highlightElement(code)
    } catch {
      // keep raw block
    }

    const language = getCodeLanguage(code)
    const wrapper = document.createElement('div')
    wrapper.className =
      'not-prose my-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm'

    const header = document.createElement('div')
    header.className =
      'flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'
    header.textContent = language

    const body = document.createElement('div')
    body.className = 'px-4 py-4 text-sm leading-7 text-slate-100'
    body.appendChild(pre.cloneNode(true))

    wrapper.appendChild(header)
    wrapper.appendChild(body)
    pre.replaceWith(wrapper)
  })
}

type Props = {
  html: string
  slug: string
  className?: string
}

export function CaseStudyArticleBody({ html, slug, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) {
      return
    }

    void enhanceCodeBlocks(ref.current)
  }, [html, slug])

  return (
    <div
      ref={ref}
      className={
        className ??
        "max-w-none text-base leading-8 text-slate-700 [&>h2]:mt-14 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-slate-950 [&>h2:first-child]:mt-0 [&>h2]:before:mb-5 [&>h2]:before:block [&>h2]:before:h-0.5 [&>h2]:before:w-10 [&>h2]:before:rounded-full [&>h2]:before:bg-amber-500 [&>h2]:before:content-[''] [&>p]:my-5 [&>p]:leading-8 [&>p]:text-slate-700 [&>p:first-of-type]:text-lg [&>p:first-of-type]:text-slate-800 [&>ul]:my-6 [&>ul]:space-y-3 [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:leading-7 [&>ul>li]:text-slate-700 [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.65em] [&>ul>li]:before:h-1.5 [&>ul>li]:before:w-1.5 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-amber-500 [&>ul>li]:before:content-[''] [&_a]:font-medium [&_a]:text-amber-700 [&_a]:underline [&_a]:decoration-amber-300 [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:hover:text-amber-800 [&_a]:hover:decoration-amber-500 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-slate-100 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[0.9em] [&_:not(pre)>code]:text-slate-800"
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
