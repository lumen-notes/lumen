import React from "react"
import { LinkProps, Link as RouterLink, matchPath, Params } from "react-router-dom"
import { z } from "zod"
import { DatePanel } from "../panels/date"
import { NotePanel } from "../panels/note"
import { TagPanel } from "../panels/tag"
import { insertAt } from "../utils/insert-at"
import { useSearchParam } from "../utils/use-search-param"

const PanelsContext = React.createContext<{
  panels: string[]
  openPanel?: (url: string, afterIndex?: number) => void
  closePanel?: (index: number) => void
}>({
  panels: [],
})

const PanelContext = React.createContext<{
  url?: string
  index?: number
}>({})

type PanelsProps = {
  children?: React.ReactNode
}

function Root({ children }: PanelsProps) {
  const [panels, setPanels] = useSearchParam("p", { defaultValue: [], schema: z.array(z.string()) })

  function openPanel(url: string, afterIndex?: number) {
    // Add to the beginning of the list by default
    const index = afterIndex !== undefined ? afterIndex + 1 : 0
    setPanels(insertAt(panels, index, url))
  }

  function closePanel(index: number) {
    setPanels(panels.filter((_, i) => i !== index))
  }

  return (
    <PanelsContext.Provider value={{ panels, openPanel, closePanel }}>
      <div className="flex h-full overflow-y-hidden">{children}</div>
    </PanelsContext.Provider>
  )
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
      {panels.map((url, index) => (
        <PanelContext.Provider key={index} value={{ url, index }}>
          <PanelRoute pattern="/:id" panel={NotePanel} />
          <PanelRoute pattern="/tags/:name" panel={TagPanel} />
          <PanelRoute pattern="/dates/:date" panel={DatePanel} />
        </PanelContext.Provider>
      ))}
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
  const { url, index } = React.useContext(PanelContext)

  if (!url) return null

  const match = matchPath(pattern, url)

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
