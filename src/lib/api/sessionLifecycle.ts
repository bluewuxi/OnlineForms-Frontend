import type { OrgSessionHeaders } from './types'

type SessionLifecycleHandlers = {
  onSessionRefreshed?: (nextSession: OrgSessionHeaders) => void
  onSessionInvalidated?: () => void
}

let handlers: SessionLifecycleHandlers = {}

export function registerSessionLifecycleHandlers(nextHandlers: SessionLifecycleHandlers) {
  handlers = nextHandlers
  return () => {
    if (handlers === nextHandlers) {
      handlers = {}
    }
  }
}

export function notifySessionRefreshed(nextSession: OrgSessionHeaders) {
  handlers.onSessionRefreshed?.(nextSession)
}

export function notifySessionInvalidated() {
  handlers.onSessionInvalidated?.()
}
