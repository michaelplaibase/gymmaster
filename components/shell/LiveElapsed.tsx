'use client'

import { useEffect, useState } from 'react'
import { formatDuration } from '@/lib/date'

// Ticking elapsed time for an active workout or fast.
export function LiveElapsed({ startedAtMs }: { startedAtMs: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span suppressHydrationWarning>
      {formatDuration((now - startedAtMs) / 1000)}
    </span>
  )
}

export default LiveElapsed
