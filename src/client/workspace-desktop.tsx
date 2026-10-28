import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Toast } from '@deepseek-ai/dsh-client-ui-primitives'
import { canOpenHostPath, type ClientWorkspaceDesktop } from './actions.js'

/**
 * One desktop-capability read per Client instance.
 * The Host answer is deployment-wide, so every Worktree surface shares it
 * instead of spending one Remote round trip per mounted control.
 */
const availability = new WeakMap<ClientWorkspaceDesktop, Promise<boolean>>()

function readAvailability(remote: ClientWorkspaceDesktop): Promise<boolean> {
  let pending = availability.get(remote)
  if (pending === undefined) {
    pending = canOpenHostPath({ remote })
    availability.set(remote, pending)
  }
  return pending
}

/** Warm the shared read during Client boot so an open menu does not pop the row in late. */
export function prefetchHostDesktop(remote: ClientWorkspaceDesktop | undefined): void {
  if (typeof remote?.session?.canOpenWorkspacePath === 'function') void readAvailability(remote)
}

/** undefined while the shared read is pending; false when the Host has no desktop opener. */
export function useHostDesktopAvailable(remote: ClientWorkspaceDesktop | undefined): boolean | undefined {
  const [available, setAvailable] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    if (remote === undefined) {
      setAvailable(false)
      return
    }
    let active = true
    void readAvailability(remote).then(value => {
      if (active) setAvailable(value)
    })
    return () => { active = false }
  }, [remote])
  return remote === undefined ? false : available
}

interface FailureBanner {
  seq: number
  text: string
}

/**
 * Transient failure banner owned by the gesture's control.
 * Menu rows close before the request settles, so an inline error inside the
 * menu would never be seen; the banner is announced from the control instead.
 */
export function useOpenFailureToast(): { toast: ReactNode; show(text: string): void } {
  const seq = useRef(0)
  const [banner, setBanner] = useState<FailureBanner | null>(null)
  const dismiss = useCallback(() => { setBanner(null) }, [])
  return {
    toast: banner === null
      ? null
      // A failure that names what broke needs a longer read than a one-liner.
      : <Toast key={banner.seq} text={banner.text} holdMs={5_000} onDone={dismiss} />,
    show: (text: string) => {
      seq.current += 1
      setBanner({ seq: seq.current, text })
    },
  }
}
