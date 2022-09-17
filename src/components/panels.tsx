import qs from "qs"
import React from "react"
import {
  Link as RouterLink,
  LinkProps,
  matchRoutes,
  Params,
  useLocation,
  useNavigate,
} from "react-router-dom"
import { z } from "zod"
import { DatePanel } from "../panels/date"
import { NotePanel } from "../panels/note"
import { NotesPanel } from "../panels/notes"
import { TagPanel } from "../panels/tag"
import { TagsPanel } from "../panels/tags"
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

const Link = React.forwardRef<HTMLAnchorElement, LinkProps & { to: string }>(
  ({ target = "_blank", ...props }, ref) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { openPanel, updatePanel } = React.useContext(PanelsContext)
    const panel = React.useContext(PanelContext)
    return (
      <RouterLink
        {...props}
        ref={ref}
        onClick={(event) => {
          if (!props.to || event.metaKey || event.ctrlKey || event.shiftKey) return

          // Open link in a new panel
          if (target === "_blank") {
            openPanel?.(props.to, panel?.index)
            event.preventDefault()
          }

          // Open link in the current panel
          if (target === "_self") {
            const [pathname, search] = props.to.split("?")

            if (panel) {
              updatePanel?.(panel?.index, { pathname, search })
            } else {
              // Preserve the current search params
              const combinedSearch = {
                ...qs.parse(location.search, { ignoreQueryPrefix: true }),
                ...qs.parse(search),
              }

              navigate({
                pathname,
                search: qs.stringify(combinedSearch),
              })
            }

            event.preventDefault()
          }
        }}
      />
    )
  },
)

function Outlet() {
  const { panels } = React.useContext(PanelsContext)
  return (
    <>
      {panels.map((value, index) => {
        const panel = deserializePanelValue(value)
        return (
          <PanelContext.Provider key={panel.id} value={{ ...panel, index }}>
            <PanelRoutes />
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

const ROUTES: Array<{ path?: string; index?: boolean; panel: React.ComponentType<PanelProps> }> = [
  { index: true, panel: NotesPanel },
  { path: ":id", panel: NotePanel },
  { path: "tags", panel: TagsPanel },
  { path: "tags/:name", panel: TagPanel },
  { path: "dates/:date", panel: DatePanel },
]

// type PanelRoutesProps = { panel: PanelValue; index: number }

function PanelRoutes() {
  const { closePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)

  if (!panel) return <div>Unexpected error</div>

  const [match] = matchRoutes(ROUTES, { pathname: panel.pathname }) || []

  if (!match || !("panel" in match.route)) return <div>Unexpected error</div>

  // @ts-ignore If we get here, we know that the `panel` property exists
  const { panel: Panel } = match.route

  return (
    <Panel
      id={panel.id}
      params={match.params}
      onClose={() => {
        closePanel?.(panel.index)
      }}
    />
  )
}

export const Panels = Object.assign(Root, { Link, Outlet })
