import { useEffect, type RefObject } from 'react'

/**
 * Tracks the composer bottom-dock height on a CSS variable (`--dock-h`) so the
 * transcript can reserve room for it. The dock grows with the auto-growing
 * composer, queued messages, and docked cards; a static padding cannot track
 * that, so the tallest dock states covered the transcript tail.
 */
export function useComposerDockHeight(paneRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const pane = paneRef.current
    if (!pane || typeof ResizeObserver === 'undefined') return
    const dock = pane.querySelector('.conversation-bottom-dock')
    if (!(dock instanceof HTMLElement)) return
    const sync = () => pane.style.setProperty('--dock-h', `${Math.max(0, Math.ceil(dock.getBoundingClientRect().height))}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(dock)
    return () => observer.disconnect()
  }, [paneRef])
}
