import qs from "qs"
import React from "react"
import { flushSync } from "react-dom"
import { Params, To, matchRoutes, resolvePath, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useSearchParam } from "../hooks/search-param"
import { FilePanel } from "../panels/file"
import { NotePanel } from "../panels/note"
import { NotesPanel } from "../panels/notes"
import { TagPanel } from "../panels/tag"
import { TagsPanel } from "../panels/tags"
import { ErrorIcon16 } from "./icons"
import { LinkClickHandler, LinkContext } from "./link"
import { Panel } from "./panel"

type PanelValue = {
  id: string
  pathname: string
  search: string
}

const PanelsContext = React.createContext<string[]>([])
export const usePanels = () => React.useContext(PanelsContext)

const PanelContext = React.createContext<(PanelValue & { index: number }) | null>(null)
export const usePanel = () => React.useContext(PanelContext)

const PanelActionsContext = React.createContext<{
  openPanel?: (to: To, afterIndex?: number) => void
  closePanel?: (index: number, id: PanelValue["id"]) => void
  updatePanel?: (index: number, partialValue: Partial<Exclude<PanelValue, "id">>) => void
}>({})
export const usePanelActions = () => React.useContext(PanelActionsContext)

function Provider({ children }: React.PropsWithChildren) {
  const [panels, setPanels] = useSearchParam("p", {
    validate: z.array(z.string().catch("")).catch([]).parse,
  })

  const panelsRef = React.useRef<string[]>(panels)

  React.useEffect(() => {
    panelsRef.current = panels
  }, [panels])

  // useEvent("keydown", (event) => {
  //   // Focus prev/next panel with `command + shift + left/right`
  //   if (
  //     (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
  //     (event.metaKey || event.ctrlKey) &&
  //     event.shiftKey
  //   ) {
  //     const panelElements = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"))

  //     const focusedPanelElement = panelElements.find((panelElement) =>
  //       panelElement.contains(document.activeElement),
  //     )

  //     const focusedPanelIndex = focusedPanelElement
  //       ? panelElements.indexOf(focusedPanelElement)
  //       : -1

  //     if (event.key === "ArrowLeft" && event.altKey) {
  //       const firstPanel = panelElements[0]
  //       focusPanel(firstPanel)
  //     } else if (event.key === "ArrowRight" && event.altKey) {
  //       const lastPanel = panelElements[panelElements.length - 1]
  //       focusPanel(lastPanel)
  //     } else if (event.key === "ArrowLeft" && focusedPanelIndex > 0) {
  //       // If the user presses the left arrow key and focus is not on the first panel,
  //       // move focus to the previous panel
  //       const prevPanel = panelElements[focusedPanelIndex - 1]
  //       focusPanel(prevPanel)
  //       event.preventDefault()
  //     } else if (event.key === "ArrowRight" && focusedPanelIndex < panelElements.length - 1) {
  //       // If the user presses the right arrow key and focus is not on the last panel,
  //       // move focus to the next panel
  //       const nextPanel = panelElements[focusedPanelIndex + 1]
  //       focusPanel(nextPanel)
  //       event.preventDefault()
  //     }
  //   }
  // })

  const openPanel = React.useCallback(
    (to: To, afterIndex?: number) => {
      // Add to the beginning of the list by default
      const index = afterIndex !== undefined ? afterIndex + 1 : 0

      const id = generateId()
      const { pathname, search } = resolvePath(to)
      const value = stringifyPanelValue({ id, pathname, search })

      const newPanels = panelsRef.current.slice(0, index).concat(value)

      flushSync(() => {
        setPanels(newPanels)
      })

      const panelElement = document.getElementById(id)

      if (panelElement) {
        // Move focus to the new panel
        focusPanel(panelElement)
      }
    },
    [setPanels],
  )

  const closePanel = React.useCallback(
    (index: number, id: string) => {
      const panelElements = Array.from(document.querySelectorAll("[data-panel]")) as HTMLElement[]

      const currentIndex = panelElements.findIndex((panelElement) => panelElement.id === id)

      const isPanelFocused =
        document.activeElement?.closest("[data-panel]") === panelElements[currentIndex]

      const prevPanelElement = panelElements[currentIndex - 1]

      const newPanels = panelsRef.current.filter((_, i) => i !== index)

      // Update state
      flushSync(() => {
        setPanels(newPanels)
      })

      // Focus the previous panel
      if (isPanelFocused && prevPanelElement) {
        focusPanel(prevPanelElement)
      }
    },
    [setPanels],
  )

  const updatePanel = React.useCallback(
    (index: number, partialValue: Partial<Exclude<PanelValue, "id">>) => {
      setPanels((panels) => {
        const oldValue = parsePanelValue(panels[index])
        const newValue = stringifyPanelValue({ ...oldValue, ...partialValue })
        return panels.map((value, i) => (i === index ? newValue : value))
      })
    },
    [setPanels],
  )

  const panelActions = React.useMemo(
    () => ({
      openPanel,
      closePanel,
      updatePanel,
    }),
    [openPanel, closePanel, updatePanel],
  )

  return (
    <PanelsContext.Provider value={panels}>
      <PanelActionsContext.Provider value={panelActions}>{children}</PanelActionsContext.Provider>
    </PanelsContext.Provider>
  )
}

Provider.displayName = "Panels.Provider"

function Container({ children }: React.PropsWithChildren) {
  return (
    <div data-panel-container className="block h-full overflow-hidden md:flex">
      {children}
    </div>
  )
}

Container.displayName = "Panels.Container"

function Outlet() {
  const panels = usePanels()
  return (
    <>
      {panels.map((value, index) => {
        const { id } = parsePanelValue(value)
        return (
          <React.Fragment key={id}>
            <div className="hidden h-full w-px flex-shrink-0 bg-border-secondary md:block" />
            <PanelRouter key={id} value={value} index={index} />
          </React.Fragment>
        )
      })}
    </>
  )
}

export type PanelProps = {
  id?: string
  params?: Params<string>
  onClose?: () => void
}

const ROUTES: Array<{ path?: string; index?: boolean; panel: React.ComponentType<PanelProps> }> = [
  { index: true, panel: NotesPanel },
  { path: "*", panel: NotePanel },
  { path: "tags", panel: TagsPanel },
  { path: "tags/*", panel: TagPanel },
  { path: "file", panel: FilePanel },
]

type PanelRouterProps = { value: string; index: number }

const PanelRouter = React.memo(function PanelRouter({ value, index }: PanelRouterProps) {
  const panel = parsePanelValue(value)
  const { closePanel } = usePanelActions()

  const contextValue = React.useMemo(
    () => ({
      ...panel,
      index,
    }),
    [panel, index],
  )

  if (!panel) {
    return <ErrorPanel onClose={() => closePanel?.(index, "")}>Invalid panel</ErrorPanel>
  }

  const [match] = matchRoutes(ROUTES, { pathname: panel.pathname }) || []

  if (!match || !("panel" in match.route)) {
    return <ErrorPanel onClose={() => closePanel?.(index, panel.id)}>Invalid panel</ErrorPanel>
  }

  // @ts-ignore If we get here, we know that the `panel` property exists
  const { panel: Panel } = match.route

  return (
    <PanelContext.Provider value={contextValue}>
      {/* @ts-ignore */}
      <Panel
        id={panel.id}
        params={match.params}
        onClose={() => {
          closePanel?.(index, panel.id)
        }}
      />
    </PanelContext.Provider>
  )
})

function ErrorPanel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <Panel title="Error" icon={<ErrorIcon16 className="text-text-danger" />} onClose={onClose}>
      <div className="p-4 text-text-danger">{children}</div>
    </Panel>
  )
}

export function usePanelLinkClickHandler() {
  const navigate = useNavigate()
  const { openPanel, updatePanel } = usePanelActions()
  const panel = usePanel()

  const handleClick: LinkClickHandler = React.useCallback(
    ({ to, target }, event) => {
      // Preserve the view and layout when navigating between panels
      const view = new URLSearchParams(panel ? panel.search : location.search).get("view")
      const layout = new URLSearchParams(panel ? panel.search : location.search).get("layout")
      const { pathname, search } = resolvePath(to)
      const href = `${pathname}?${qs.stringify({
        view,
        layout,
        ...qs.parse(search, { ignoreQueryPrefix: true }),
      })}`

      // Fall back to default browser behavior when any modifier keys are pressed
      if (event?.metaKey || event?.ctrlKey || event?.shiftKey) {
        return
      }

      // Fall back to default browser behavior if we're not in a panels context
      if (!openPanel || !updatePanel) {
        return
      }

      // Open link in a new panel
      if (target === "_blank" && !event?.altKey) {
        openPanel(href, panel?.index)
        event?.preventDefault()
        return
      }

      // Open link in the current panel
      if (panel) {
        updatePanel(panel?.index, { pathname, search })
      } else {
        // Preserve the current search params
        const combinedSearch = {
          ...qs.parse(location.search, { ignoreQueryPrefix: true }),
          ...qs.parse(search, { ignoreQueryPrefix: true }),
        }

        navigate({
          pathname,
          search: qs.stringify(combinedSearch),
        })
      }

      event?.preventDefault()
    },
    [panel, openPanel, updatePanel, navigate],
  )

  return handleClick
}

function LinkProvider({ children }: { children: React.ReactNode }) {
  const handleClick = usePanelLinkClickHandler()
  return <LinkContext.Provider value={handleClick}>{children}</LinkContext.Provider>
}

export const Panels = Object.assign({}, { Provider, Container, Outlet, LinkProvider })

// Utilities

/** Generate a unique identifier */
function generateId() {
  return Date.now().toString(16).slice(-4)
}

/** Get the first focusable child of an element */
function getFirstFocusableChild(element: HTMLElement): HTMLElement | null {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return focusableElements.length ? focusableElements[0] : null
}

function focusPanel(panelElement: HTMLElement) {
  const firstNote = panelElement.querySelector<HTMLElement>("[data-note-id]")
  const firstFocusableChild = getFirstFocusableChild(panelElement)

  if (firstNote) {
    firstNote.focus({ preventScroll: true })
  } else if (firstFocusableChild) {
    firstFocusableChild.focus({ preventScroll: true })
  }

  scrollPanelIntoView(panelElement)
}

function scrollPanelIntoView(panelElement: HTMLElement) {
  const scrollContainer = getScrollContainer(panelElement) || document.body

  const scrollContainerRect = scrollContainer.getBoundingClientRect()

  const panelRect = panelElement.getBoundingClientRect()

  const nextPanel = panelElement.nextElementSibling as HTMLElement | null

  const nextPanelRect = nextPanel ? nextPanel.getBoundingClientRect() : null

  const panelOverlap = nextPanelRect ? Math.max(0, panelRect.right - nextPanelRect.left) : 0

  const overflowRight = Math.max(0, panelRect.right - scrollContainerRect.right)

  scrollContainer.scrollLeft -= panelOverlap
  scrollContainer.scrollLeft += overflowRight
}

/**
 * Returns the nearest scrollable parent of the element or `null` if the element
 * is not contained in a scrollable element.
 */
function getScrollContainer(element: HTMLElement | null): HTMLElement | null {
  if (!element || element === document.body) {
    return null
  }

  return isScrollable(element) ? element : getScrollContainer(element.parentElement)
}

/** Returns `true` if the element is scrollable */
function isScrollable(element: Element) {
  const hasVerticalScrollableContent = element.scrollHeight > element.clientHeight
  const hasHorizontalScrollableContent = element.scrollWidth > element.clientWidth

  return (
    (hasVerticalScrollableContent &&
      !(window.getComputedStyle(element).overflowY.indexOf("hidden") !== -1)) ||
    (hasHorizontalScrollableContent &&
      !(window.getComputedStyle(element).overflowX.indexOf("hidden") !== -1))
  )
}

const SEPARATOR = ":"

function stringifyPanelValue({ id, pathname, search }: PanelValue) {
  return [id, pathname, search].join(SEPARATOR)
}

function parsePanelValue(value: string): PanelValue {
  const [id, pathname, search] = value.split(SEPARATOR)
  return { id, pathname, search }
}
