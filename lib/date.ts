export function isoFromDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Local calendar date, not UTC.
export function todayIso(now: Date = new Date()): string {
  return isoFromDate(now)
}

// 'H:MM:SS' when hours > 0, else 'MM:SS'.
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

// 'Today', 'Yesterday', or 'Mon 14 Jul'.
export function formatRelativeDay(ts: number, now: Date = new Date()): string {
  const date = new Date(ts)
  const dayIso = isoFromDate(date)
  if (dayIso === isoFromDate(now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dayIso === isoFromDate(yesterday)) return 'Yesterday'
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${weekday} ${date.getDate()} ${month}`
}
