import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Not Found',
}

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-[calc(var(--nav-h,calc(4rem_+_env(safe-area-inset-bottom)))_+_2.5rem)] text-center">
      <div className="num text-7xl font-bold leading-none text-muted">404</div>
      <h1 className="mt-3 font-display text-xl font-semibold uppercase tracking-wide">
        Nothing here
      </h1>
      <p className="mt-2 max-w-64 text-sm leading-snug text-muted">
        This screen does not exist, or the match you were looking for is already gone.
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-12 items-center rounded-xl bg-text px-6 font-display text-sm font-bold uppercase tracking-wide text-bg active:bg-text/80"
      >
        Back to Home
      </Link>
    </main>
  )
}
