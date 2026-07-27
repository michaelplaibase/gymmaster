import Link from 'next/link'
import type { ReactNode } from 'react'

export function Screen({
  title,
  back,
  action,
  children,
  padded = true,
}: {
  title?: string
  back?: string
  action?: ReactNode
  children: ReactNode
  padded?: boolean
}) {
  const hasHeader = Boolean(title || back || action)
  return (
    <div className="min-h-dvh">
      {hasHeader && (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/85 pt-safe backdrop-blur">
          <div className="flex h-12 items-center px-2">
            {back && (
              <Link
                href={back}
                aria-label="Back"
                className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-text"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M15 5 L8 12 L15 19"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
            <h1 className="min-w-0 flex-1 truncate px-2 font-display text-base font-semibold uppercase tracking-wide">
              {title}
            </h1>
            {action && <div className="flex shrink-0 items-center pr-1">{action}</div>}
          </div>
        </header>
      )}
      <main
        className={`${padded ? 'px-4 pt-4' : ''} pb-[calc(var(--nav-h,calc(4rem_+_env(safe-area-inset-bottom)))_+_2.5rem)]`}
      >
        {children}
      </main>
    </div>
  )
}

export default Screen
