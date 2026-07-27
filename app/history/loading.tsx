export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center pb-[calc(var(--nav-h,calc(4rem_+_env(safe-area-inset-bottom)))_+_2.5rem)]">
      <span className="animate-pulse font-display text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">
        Loading
      </span>
    </div>
  )
}
