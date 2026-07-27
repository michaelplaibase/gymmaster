'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 11 L12 4 L20 11 V20 H14.5 V14.5 H9.5 V20 H4 Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/train',
    label: 'Train',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M1.5 12 H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 12 H22.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="4.5" y="7" width="3.5" height="10" rx="1" fill="currentColor" />
        <rect x="16" y="7" width="3.5" height="10" rx="1" fill="currentColor" />
        <path d="M8 12 H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/fast',
    label: 'Fast',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="13.5" r="7.5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 13.5 V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9.5 2.5 H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 2.5 V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="7.5" r="3.75" stroke="currentColor" strokeWidth="2" />
        <path
          d="M4.5 20.5 C4.5 16.5 7.8 14.25 12 14.25 C16.2 14.25 19.5 16.5 19.5 20.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function AppNav() {
  const pathname = usePathname()
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) return null

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-md pb-safe">
        {TABS.map((tab) => {
          const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 ${
                active ? 'text-text' : 'text-muted active:text-text'
              }`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-text"
                />
              )}
              {tab.icon}
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default AppNav
