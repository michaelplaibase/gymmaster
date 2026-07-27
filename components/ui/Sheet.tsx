'use client'

import type { ReactNode } from 'react'

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="anim-fade-in absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="animate-sheet-in absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-2xl border-t border-border bg-surface px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
        {title && (
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-widest text-muted">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}

export default Sheet
