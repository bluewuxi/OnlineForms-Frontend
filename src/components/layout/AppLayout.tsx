import type { ReactNode } from 'react'

type AppLayoutProps = {
  header: ReactNode
  children: ReactNode
  notificationSlot?: ReactNode
  section?: 'public' | 'org' | 'login' | 'internal'
}

export function AppLayout({
  header,
  children,
  notificationSlot,
  section = 'public',
}: AppLayoutProps) {
  return (
    <div className={`app-frame app-frame--${section}`}>
      {header}
      {notificationSlot}
      <div className="app-frame__body">{children}</div>
    </div>
  )
}
