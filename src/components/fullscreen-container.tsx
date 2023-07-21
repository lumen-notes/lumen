import React from "react"
import { LinkProps, Link as RouterLink, useNavigate } from "react-router-dom"
import { cx } from "../utils/cx"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { ChevronLeftIcon16, ChevronRightIcon16, MoreIcon16 } from "./icons"
import { LinkContext } from "./link-context"
import { ThemeColor } from "./theme-color"

type FullscreenContainerProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  elevation?: 0 | 1
  // List of DropdownMenu.Item or DropdownMenu.Separator
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function FullscreenContainer({
  title,
  description,
  icon,
  elevation = 0,
  actions,
  children,
}: FullscreenContainerProps) {
  const navigate = useNavigate()
  return (
    <div className={cx("flex min-h-full flex-col")}>
      {/* Make browser toolbar color match the header color */}
      <ThemeColor propertyName={elevation === 0 ? "--color-bg-inset" : "--color-bg"} />

      {/* Make the body background color match the header color */}
      <style>
        {`body {
          background-color: var(${elevation === 0 ? "--color-bg-inset" : "--color-bg"});
        }`}
      </style>

      {/* Header */}
      <div
        className={cx(
          "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b p-1 backdrop-blur-md",
          elevation === 0 ? "from-bg-inset to-bg-inset-backdrop" : "from-bg to-bg-backdrop",
        )}
      >
        <div className="flex flex-shrink items-center gap-4">
          <div className="flex">
            <IconButton
              aria-label="Back"
              onClick={() => navigate(-1)}
              shortcut={["⌘", "["]}
              // TODO: Disable when at the beginning of history
            >
              <ChevronLeftIcon16 />
            </IconButton>
            <IconButton
              aria-label="Forward"
              onClick={() => navigate(1)}
              shortcut={["⌘", "]"]}
              // TODO: Disable when at the end of history
            >
              <ChevronRightIcon16 />
            </IconButton>
          </div>
          <div className="flex flex-shrink items-center gap-2">
            <div className="flex-shrink-0 text-text-secondary">{icon}</div>
            <div className="flex items-baseline gap-3 overflow-hidden">
              <h2 className="flex-shrink-0 leading-4">{title}</h2>
              {/* {description ? (<span className="truncate text-text-secondary">{description}</span>) : null} */}
            </div>
          </div>
        </div>

        {actions ? (
          <DropdownMenu modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Actions" disableTooltip>
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">{actions}</DropdownMenu.Content>
          </DropdownMenu>
        ) : null}
      </div>

      <LinkContext.Provider value={Link}>{children}</LinkContext.Provider>
    </div>
  )
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => {
  let url = to

  // Add `fullscreen=true` to the query string
  if (typeof to === "string") {
    // Check if `to` contains a query string
    url = to.includes("?") ? `${to}&fullscreen=true` : `${to}?fullscreen=true`
  } else {
    url = { ...to, search: to.search ? `${to.search}&fullscreen=true` : "?fullscreen=true" }
  }

  return (
    <RouterLink
      {...props}
      ref={ref}
      to={url}
      // Always open links in the same tab in fullscreen mode
      target="_self"
    />
  )
})
