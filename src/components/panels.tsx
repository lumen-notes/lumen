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
import { FilePanel } from "../panels/file"
import { NotePanel } from "../panels/note"
import { NotesPanel } from "../panels/notes"
import { TagPanel } from "../panels/tag"
import { TagsPanel } from "../panels/tags"
import { useSearchParam } from "../utils/use-search-param"
import { LinkContext } from "./link-context"

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

      setPanels(panels.slice(0, index).concat(value))

      setTimeout(() => {
        const panelElement = document.getElementById(id)

        // Scroll the new panel into view
        panelElement?.scrollIntoView({ block: "center", inline: "center" })

        // Focus the new panel
        panelElement?.focus()
      })
    },
    [panels, setPanels],
  )

  const closePanel = React.useCallback(
    (index: number) => {
      const panel = deserializePanelValue(panels[index])

      const panelElements = Array.from(document.querySelectorAll("[data-panel]")) as HTMLElement[]

      const currentIndex = panelElements.findIndex((panelElement) => panelElement.id === panel.id)

      // Focus the previous panel
      panelElements[currentIndex - 1]?.focus()

      // Update state
      setPanels(panels.slice(0, index))
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

  const contextValue = React.useMemo(
    () => ({
      panels,
      openPanel,
      closePanel,
      updatePanel,
    }),
    [panels, openPanel, closePanel, updatePanel],
  )

  return (
    <PanelsContext.Provider value={contextValue}>
      <LinkContext.Provider value={Link}>
        <div className="flex h-full overflow-y-hidden">{children}</div>
      </LinkContext.Provider>
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

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { openPanel, updatePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)
  return (
    <RouterLink
      {...props}
      ref={ref}
      onClick={(event) => {
        if (typeof props.to !== "string" || event.metaKey || event.ctrlKey || event.shiftKey) {
          return
        }

        // Open link in a new panel
        if (props.target === "_blank") {
          openPanel?.(props.to, panel?.index)
          event.preventDefault()
        }

        // Open link in the current panel
        if (props.target === "_self") {
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
})

function Outlet() {
  const { panels } = React.useContext(PanelsContext)
  return (
    <>
      {panels.map((value, index) => {
        const panel = deserializePanelValue(value)
        return <PanelRoutes key={panel.id} panel={panel} index={index} />
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
  { path: "file", panel: FilePanel },
]

type PanelRoutesProps = { panel: PanelValue; index: number }

function PanelRoutes({ panel, index }: PanelRoutesProps) {
  const { closePanel } = React.useContext(PanelsContext)

  const contextValue = React.useMemo(
    () => ({
      ...panel,
      index,
    }),
    [panel, index],
  )

  if (!panel) return <div>Unexpected error</div>

  const [match] = matchRoutes(ROUTES, { pathname: panel.pathname }) || []

  if (!match || !("panel" in match.route)) return <div>Unexpected error</div>

  // @ts-ignore If we get here, we know that the `panel` property exists
  const { panel: Panel } = match.route

  return (
    <PanelContext.Provider value={contextValue}>
      <Panel
        id={panel.id}
        params={match.params}
        onClose={() => {
          closePanel?.(index)
        }}
      />
    </PanelContext.Provider>
  )
}

export const Panels = Object.assign(Root, { Link, Outlet })
