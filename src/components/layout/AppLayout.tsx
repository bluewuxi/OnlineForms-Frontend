import type { ReactNode } from 'react'

type AppLayoutProps = {
  header: ReactNode
  children: ReactNode
  notificationSlot?: ReactNode
}

export function AppLayout({
  header,
  children,
  notificationSlot,
}: AppLayoutProps) {
  return (
    <div className="app-frame">
      {header}
      {notificationSlot}
      <div className="app-frame__body">{children}</div>
    </div>
  )
}
