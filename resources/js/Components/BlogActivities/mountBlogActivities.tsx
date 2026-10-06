'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import LanguageRaceActivity from '@/Components/BlogActivities/LanguageRaceActivity'
import LoadBalancerActivity from '@/Components/BlogActivities/LoadBalancerActivity'
import PresignedUrlActivity from '@/Components/BlogActivities/PresignedUrlActivity'
import TerraformPulumiActivity from '@/Components/BlogActivities/TerraformPulumiActivity'

const activities: Record<string, () => ReactNode> = {
  'load-balancer': () => <LoadBalancerActivity />,
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

export function mountBlogActivities(root: HTMLElement): () => void {
  const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-blog-activity]'))
  const roots: Root[] = []

  nodes.forEach((node) => {
    const id = node.dataset.blogActivity ?? ''
    const render = activities[id]
    const reactRoot = createRoot(node)

    reactRoot.render(
      <ActivityBoundary>
        {render ? render() : <p className="text-sm text-slate-500">This figure is unavailable.</p>}
      </ActivityBoundary>,
    )
    roots.push(reactRoot)
  })

  return () => {
    roots.forEach((reactRoot) => reactRoot.unmount())
  }
}
