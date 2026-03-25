import type { ReactNode } from 'react'

type ListDetailLayoutProps = {
  list: ReactNode
  detail: ReactNode
  mode?: 'default' | 'internal'
}

export function ListDetailLayout({
  list,
  detail,
  mode = 'default',
}: ListDetailLayoutProps) {
  const className =
    mode === 'internal'
      ? 'list-detail-layout list-detail-layout--internal'
      : 'list-detail-layout'

  return (
    <div className={className}>
      <div className="list-detail-layout__list">{list}</div>
      <div className="list-detail-layout__detail">{detail}</div>
    </div>
  )
}
