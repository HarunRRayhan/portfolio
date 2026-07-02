import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'

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

function enhanceCodeBlocks(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll('pre'))

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

    enhanceCodeBlocks(ref.current)
  }, [html, slug])

  return (
    <div
      ref={ref}
      className={
        className ??
        'prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-amber-700 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none'
      }
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}