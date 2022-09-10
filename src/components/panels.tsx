import React from "react"
import { LinkProps, Link as RouterLink, matchPath, Params } from "react-router-dom"
import { z } from "zod"
import { DatePanel } from "../panels/date"
import { NotePanel } from "../panels/note"
import { TagPanel } from "../panels/tag"
import { insertAt } from "../utils/insert-at"
import { useSearchParam } from "../utils/use-search-param"

type PanelValue = {
  id: string
  pathname: string
  search: string
}

export const PanelsContext = React.createContext<{
  panels: string[]
  openPanel?: (url: string, afterIndex?: number) => void
  closePanel?: (index: number) => void
  updatePanel?: (index: number, partialValue: Partial<Exclude<PanelValue, "id">>) => void
}>({
  panels: [],
})

export const PanelContext = React.createContext<(PanelValue & { index: number }) | null>(null)

function Root({ children }: React.PropsWithChildren) {
  const [panels, setPanels] = useSearchParam("p", {
    defaultValue: [],
    schema: z.array(z.string()),
  })

  const openPanel = React.useCallback(
    (url: string, afterIndex?: number) => {
      // Add to the beginning of the list by default
      const index = afterIndex !== undefined ? afterIndex + 1 : 0

      const id = generateId()
      const [pathname, search] = url.split("?")
      const value = serializePanelValue({ id, pathname, search })

      setPanels(insertAt(panels, index, value))

      setTimeout(() => {
        const panelElement = document.getElementById(id)

        // Scroll the new panel into view
        panelElement?.scrollIntoView({ block: "center", inline: "center" })

        // Focus the first focusable element in the new panel
        focusFirstFocusableElement(panelElement)
      })
    },
    [panels, setPanels],
  )

  const closePanel = React.useCallback(
    (index: number) => {
      const panel = deserializePanelValue(panels[index])

      const panelElements = Array.from(document.querySelectorAll("[data-panel]")) as HTMLElement[]

      const currentIndex = panelElements.findIndex((panelElement) => panelElement.id === panel.id)

      // Focus the first focusable element in the previous panel
      focusFirstFocusableElement(panelElements[currentIndex - 1])

      // Update state
      setPanels(panels.filter((_, i) => i !== index))
    },
    [panels, setPanels],
  )

  const updatePanel = React.useCallback(
    (index: number, partialValue: Partial<Exclude<PanelValue, "id">>) => {
      const oldValue = deserializePanelValue(panels[index])
      const newValue = serializePanelValue({ ...oldValue, ...partialValue })
      setPanels(panels.map((value, i) => (i === index ? newValue : value)))
    },
    [panels, setPanels],
  )

  return (
    <PanelsContext.Provider
      value={{
        panels,
        openPanel,
        closePanel,
        updatePanel,
      }}
    >
      <div className="flex h-full overflow-y-hidden">{children}</div>
    </PanelsContext.Provider>
  )
}

function generateId() {
  return Date.now().toString(16).slice(-4)
}

const SEPARATOR = ":"

function serializePanelValue({ id, pathname, search }: PanelValue) {
  return [id, pathname, search].join(SEPARATOR)
}

function deserializePanelValue(value: string): PanelValue {
  const [id, pathname, search] = value.split(SEPARATOR)
  return { id, pathname, search }
}

function focusFirstFocusableElement(element: HTMLElement | null) {
  const firstFocusableElement = element?.querySelector(
    'button, [href], input, select, textarea, [role=textbox], [tabindex]:not([tabindex="-1"])',
  )

  if (firstFocusableElement instanceof HTMLElement) {
    firstFocusableElement.focus()
  }
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps & { to: string }>((props, ref) => {
  const { openPanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  return (
    <RouterLink
      {...props}
      ref={ref}
      onClick={(event) => {
        if (openPanel && props.to && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
          openPanel(props.to, panel?.index)
          event.preventDefault()
        }
      }}
    />
  )
})

function Outlet() {
  const { panels } = React.useContext(PanelsContext)
  return (
    <>
      {panels.map((value, index) => {
        const { id, pathname, search } = deserializePanelValue(value)
        return (
          <PanelContext.Provider key={id} value={{ id, pathname, search, index }}>
            <PanelRoute pattern="/:id" panel={NotePanel} />
            <PanelRoute pattern="/tags/:name" panel={TagPanel} />
            <PanelRoute pattern="/dates/:date" panel={DatePanel} />
          </PanelContext.Provider>
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

type PanelRouteProps = {
  pattern: string
  panel: React.ComponentType<PanelProps>
}

function PanelRoute({ pattern, panel: Panel }: PanelRouteProps) {
  const { closePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)

  if (!panel) return null

  const match = matchPath(pattern, panel.pathname)

  return match ? (
    <Panel
      id={panel.id}
      params={match.params}
      onClose={() => {
        closePanel?.(panel.index)
      }}
    />
  ) : null
}

export const Panels = Object.assign(Root, { Link, Outlet })
