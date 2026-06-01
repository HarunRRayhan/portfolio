import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Discussion unavailable</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">We could not load this section.</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Please refresh the page or try again in a moment.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
