import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'The route could not be rendered.'

  return (
    <section className="content-panel content-panel--narrow" role="alert">
      <p className="section-heading__eyebrow">Route error</p>
      <h1>Something went wrong while loading the page</h1>
      <p>{message}</p>
    </section>
  )
}
