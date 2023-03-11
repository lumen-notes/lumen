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
import { useEvent } from "react-use"
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

  useEvent("keydown", (event) => {
    // Focus prev/next panel with `command + shift + left/right`
    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      event.metaKey &&
      event.shiftKey
    ) {
      const panelElements = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"))

      const focusedPanelElement = panelElements.find((panelElement) =>
        panelElement.contains(document.activeElement),
      )

      const focusedPanelIndex = focusedPanelElement
        ? panelElements.indexOf(focusedPanelElement)
        : -1

      if (event.key === "ArrowLeft" && event.altKey) {
        const firstPanel = panelElements[0]
        focusPanel(firstPanel)
      } else if (event.key === "ArrowRight" && event.altKey) {
        const lastPanel = panelElements[panelElements.length - 1]
        focusPanel(lastPanel)
      } else if (event.key === "ArrowLeft" && focusedPanelIndex > 0) {
        // If the user presses the left arrow key and focus is not on the first panel,
        // move focus to the previous panel
        const prevPanel = panelElements[focusedPanelIndex - 1]
        focusPanel(prevPanel)
      } else if (event.key === "ArrowRight" && focusedPanelIndex < panelElements.length - 1) {
        // If the user presses the right arrow key and focus is not on the last panel,
        // move focus to the next panel
        const nextPanel = panelElements[focusedPanelIndex + 1]
        focusPanel(nextPanel)
      }
    }
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

        if (panelElement) {
          // Move focus to the new panel
          focusPanel(panelElement)
        }
      })
    },
    [panels, setPanels],
  )

  const closePanel = React.useCallback(
    (index: number) => {
      const panel = deserializePanelValue(panels[index])

      const panelElements = Array.from(document.querySelectorAll("[data-panel]")) as HTMLElement[]

      const currentIndex = panelElements.findIndex((panelElement) => panelElement.id === panel.id)

      const prevPanelElement = panelElements[currentIndex - 1]

      // Focus the previous panel
      if (prevPanelElement) {
        focusPanel(prevPanelElement)
      }

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
        <div className="flex h-full snap-x overflow-y-hidden sm:snap-none">{children}</div>
      </LinkContext.Provider>
    </PanelsContext.Provider>
  )
}

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
  const activeNoteId = panelElement.dataset.activeNoteId
  const activeNote = panelElement.querySelector<HTMLElement>(`[data-note-id="${activeNoteId}"]`)
  const firstNote = panelElement.querySelector<HTMLElement>("[data-note-id]")
  const firstFocusableChild = getFirstFocusableChild(panelElement)

  // Scroll the panel entirely into view
  panelElement.scrollIntoView({ block: "center", inline: "center" })

  if (activeNote) {
    activeNote.focus()
  } else if (firstNote) {
    firstNote.focus()
  } else if (firstFocusableChild) {
    firstFocusableChild.focus()
  }
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
  const { target = "_self" } = props
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

        // If we're not in a panels context, use the router's navigate function
        if (!openPanel || !updatePanel) {
          navigate(props.to, { replace: props.replace })
          event.preventDefault()
          return
        }

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
      {/* @ts-ignore */}
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
