'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import LanguageRaceActivity from '@/Components/BlogActivities/LanguageRaceActivity'
import LoadBalancerActivity from '@/Components/BlogActivities/LoadBalancerActivity'
import PresignedUrlActivity from '@/Components/BlogActivities/PresignedUrlActivity'
import TerraformPulumiActivity from '@/Components/BlogActivities/TerraformPulumiActivity'

const activities: Record<string, (node: HTMLElement) => ReactNode> = {
  'load-balancer': (node) => <LoadBalancerActivity algorithmId={node.dataset.algorithm ?? ''} />,
  's3-presigned-url': () => <PresignedUrlActivity />,
  'terraform-vs-pulumi': () => <TerraformPulumiActivity />,
  'language-race': () => <LanguageRaceActivity />,
}

class ActivityBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('Blog activity failed:', error, info)
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <p className="text-sm text-slate-500">This figure could not load.</p>
    }

    return this.props.children
  }
}

// Medium imports through Embedly, which renders JS; importers keep the GIF + link fallback.
const isImporter = (): boolean => navigator.webdriver || /embedly|headless|bot|crawler|spider/i.test(navigator.userAgent)

export function mountBlogActivities(root: HTMLElement): () => void {
  if (isImporter()) return () => {}

  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-blog-activity]'))
  const roots: Root[] = []

  nodes.forEach((node) => {
    const id = node.dataset.blogActivity ?? ''
    const render = activities[id]
    // Server-side GIF fallback for importers; visitors get the live figure instead.
    while (node.previousElementSibling?.hasAttribute('data-activity-fallback')) node.previousElementSibling.remove()
    const reactRoot = createRoot(node)

    reactRoot.render(
      <ActivityBoundary>
        {render ? render(node) : <p className="text-sm text-slate-500">This figure is unavailable.</p>}
      </ActivityBoundary>,
    )
    roots.push(reactRoot)
  })

  return () => {
    roots.forEach((reactRoot) => reactRoot.unmount())
  }
}
