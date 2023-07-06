import React from "react"
import { LinkProps, Link as RouterLink, useLocation, useNavigate } from "react-router-dom"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ChevronLeftIcon16, ChevronRightIcon16 } from "./icons"
import { LinkContext } from "./link-context"
import { ThemeColor } from "./theme-color"

type FullscreenContainerProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
  className?: string
  //   actions?: Array<{
  //     label: string
  //     disabled?: boolean
  //     icon?: React.ReactNode
  //     onSelect?: () => void
  //   }>
}

export function FullscreenContainer({
  title,
  description,
  icon,
  children,
  className,
}: FullscreenContainerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  console.log(location)
  return (
    // translateZ(0) fixes a bug in Safari where the scrollbar would appear underneath the sticky header
    <div
      className={cx("flex min-h-full flex-col coarse:[-webkit-transform:translateZ(0)]", className)}
    >
      {/* Make browser toolbar color match the header color */}
      <ThemeColor propertyName="--color-bg" />

      {/* Header */}
      <div
        className={
          "sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-gradient-to-b from-bg to-bg-backdrop p-1 backdrop-blur-md"
        }
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
