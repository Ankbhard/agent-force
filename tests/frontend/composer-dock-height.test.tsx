// @vitest-environment jsdom

import { useRef } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useComposerDockHeight } from '../../src/hooks/useComposerDockHeight'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []

  readonly observe = vi.fn()
  readonly unobserve = vi.fn()
  readonly disconnect = vi.fn()

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  fire() {
    this.callback([], this as unknown as ResizeObserver)
  }
}

function Harness() {
  const paneRef = useRef<HTMLElement>(null)
  useComposerDockHeight(paneRef)
  return <main ref={paneRef} className="conversation-pane"><div className="conversation-bottom-dock" /></main>
}

let root: Root
let container: HTMLDivElement
let pane: HTMLElement
let dock: HTMLElement

beforeEach(() => {
  ResizeObserverMock.instances = []
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => { root.render(<Harness />) })
  pane = container.querySelector<HTMLElement>('.conversation-pane')!
  dock = container.querySelector<HTMLElement>('.conversation-bottom-dock')!
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('composer dock height tracking', () => {
  it('publishes the measured dock height so the transcript can reserve room', () => {
    vi.spyOn(dock, 'getBoundingClientRect').mockReturnValue({ height: 220.4 } as DOMRect)
    ResizeObserverMock.instances.at(-1)!.fire()

    expect(pane.style.getPropertyValue('--dock-h')).toBe('221px')
  })

  it('keeps updating as the auto-growing composer changes height', () => {
    const rect = vi.spyOn(dock, 'getBoundingClientRect')
      .mockReturnValue({ height: 104 } as DOMRect)
    const observer = ResizeObserverMock.instances.at(-1)!
    observer.fire()
    expect(pane.style.getPropertyValue('--dock-h')).toBe('104px')

    rect.mockReturnValue({ height: 356 } as DOMRect)
    observer.fire()
    expect(pane.style.getPropertyValue('--dock-h')).toBe('356px')
  })

  it('never publishes a negative height', () => {
    vi.spyOn(dock, 'getBoundingClientRect').mockReturnValue({ height: -10 } as DOMRect)
    ResizeObserverMock.instances.at(-1)!.fire()

    expect(pane.style.getPropertyValue('--dock-h')).toBe('0px')
  })

  it('does nothing when the pane has no dock', () => {
    dock.remove()
    const observerCount = ResizeObserverMock.instances.length
    act(() => { root.render(<Harness />) })

    expect(ResizeObserverMock.instances).toHaveLength(observerCount)
  })
})
