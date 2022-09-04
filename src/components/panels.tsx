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

const PanelsContext = React.createContext<{
  panels: string[]
  openPanel?: (url: string, afterIndex?: number) => void
  closePanel?: (index: number) => void
}>({
  panels: [],
})

const PanelContext = React.createContext<Partial<PanelValue> & { index?: number }>({})

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
    },
    [panels, setPanels],
  )

  const closePanel = React.useCallback(
    (index: number) => {
      setPanels(panels.filter((_, i) => i !== index))
    },
    [panels, setPanels],
  )

  return (
    <PanelsContext.Provider value={{ panels, openPanel, closePanel }}>
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

const Link = React.forwardRef<HTMLAnchorElement, LinkProps & { to: string }>((props, ref) => {
  const { openPanel } = React.useContext(PanelsContext)
  const { index } = React.useContext(PanelContext)
  return (
    <RouterLink
      {...props}
      ref={ref}
      onClick={(event) => {
        if (openPanel && props.to && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
          openPanel(props.to, index)
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
  params: Params<string>
  onClose: () => void
}

type PanelRouteProps = {
  pattern: string
  panel: React.ComponentType<PanelProps>
}

function PanelRoute({ pattern, panel: Panel }: PanelRouteProps) {
  const { closePanel } = React.useContext(PanelsContext)
  const { pathname, index } = React.useContext(PanelContext)

  if (!pathname) return null

  const match = matchPath(pattern, pathname)

  return match ? (
    <Panel
      params={match.params}
      onClose={() => {
        if (index !== undefined) {
          closePanel?.(index)
        }
      }}
    />
  ) : null
}

export const Panels = Object.assign(Root, { Link, Outlet })
