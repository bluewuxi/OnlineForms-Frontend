type StatusChipProps = {
  tone?:
    | 'default'
    | 'success'
    | 'warning'
    | 'muted'
    | 'info'
    | 'danger'
  children: string
  className?: string
}

const toneClassMap: Record<NonNullable<StatusChipProps['tone']>, string> = {
  default: 'status-chip--default',
  success: 'status-chip--success',
  warning: 'status-chip--warning',
  muted: 'status-chip--muted',
  info: 'status-chip--info',
  danger: 'status-chip--danger',
}

export function StatusChip({
  tone = 'default',
  children,
  className,
}: StatusChipProps) {
  const classes = ['status-chip', toneClassMap[tone], className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}
