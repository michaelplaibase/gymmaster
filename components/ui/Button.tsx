import type { ButtonHTMLAttributes } from 'react'

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
  full?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-text text-bg active:bg-text/80',
  secondary: 'border border-border bg-surface-2 text-text active:bg-border/60',
  ghost: 'text-muted active:bg-surface-2 active:text-text',
  danger: 'bg-danger text-bg active:bg-danger/80',
}

const SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-14 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex select-none items-center justify-center gap-2 rounded-xl font-display font-semibold uppercase tracking-wide transition-colors disabled:pointer-events-none disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    />
  )
}

export default Button
