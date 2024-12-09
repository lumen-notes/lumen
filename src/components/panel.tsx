import React from "react"
import useResizeObserver from "use-resize-observer"
import { z } from "zod"
import { useSearchParam } from "../hooks/search-param"
import { cx } from "../utils/cx"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CenteredIcon16, XIcon16, FullwidthIcon16, MoreIcon16 } from "./icons"
import { Panels } from "./panels"

const layoutSchema = z.enum(["centered", "fullwidth"])

type Layout = z.infer<typeof layoutSchema>

type PanelProps = {
  id?: string
  className?: string
  title: string
  description?: string
  icon?: React.ReactNode
  // If layout is not provided, we give users the ability to choose
  layout?: Layout
  actions?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

export function Panel({
  id,
  className,
  title,
  description,
  icon,
  layout: controlledLayout,
  actions,
  children,
  onClose,
}: PanelProps) {
  const [layout, setLayout] = useSearchParam<Layout>("layout", {
    validate: layoutSchema.catch("centered").parse,
    replace: true,
  })

  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()

  const resolvedLayout = controlledLayout ?? layout

  return (
    <Panels.LinkProvider>
      <div
        ref={containerRef}
        id={id}
        className={cx(
          "grid h-full w-full grid-rows-[auto_1fr] overflow-hidden @container [&:not(:last-of-type)]:hidden md:[&:not(:last-of-type)]:grid",
          className,
        )}
      >
        <div
          className={
            "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-bg-inset bg-clip-border p-2 pl-4 coarse:h-14"
          }
        >
          <div className="flex flex-shrink items-center gap-3">
            <div className="flex-shrink-0 text-text-secondary">{icon}</div>
            <div className="flex items-baseline gap-3 overflow-hidden">
              <h2 className="flex-shrink-0 text-lg font-semibold leading-6">{title}</h2>
              {description ? (
                <span className="truncate text-text-secondary">{description}</span>
              ) : null}
            </div>
          </div>
          <div className="flex gap-2">
            {actions ? (
              <DropdownMenu modal={false}>
                <DropdownMenu.Trigger asChild>
                  <IconButton aria-label="Panel actions" disableTooltip>
                    <MoreIcon16 />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">{actions}</DropdownMenu.Content>
              </DropdownMenu>
            ) : null}
            {!controlledLayout && containerWidth > 672 ? (
              <DropdownMenu modal={false}>
                <DropdownMenu.Trigger asChild>
                  <IconButton aria-label="Panel actions" disableTooltip>
                    {layout === "centered" ? <CenteredIcon16 /> : <FullwidthIcon16 />}
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item
                    selected={layout === "centered"}
                    icon={<CenteredIcon16 />}
                    onSelect={() => setLayout("centered")}
                  >
                    Centered content
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    selected={layout === "fullwidth"}
                    icon={<FullwidthIcon16 />}
                    onSelect={() => setLayout("fullwidth")}
                  >
                    Fullwidth content
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            ) : null}
            {onClose ? (
              <IconButton aria-label="Close" disableTooltip onClick={onClose}>
                <XIcon16 />
              </IconButton>
            ) : null}
          </div>
        </div>
        <div className="h-full scroll-pb-4 scroll-pt-4 overflow-auto">
          <div className={cx("h-full", resolvedLayout === "centered" && "container")}>
            {children}
          </div>
        </div>
      </div>
    </Panels.LinkProvider>
  )
}
