import React from "react"
import * as RadixScrollArea from "@radix-ui/react-scroll-area"
import { cx } from "../utils/cx"

export const ScrollArea = React.forwardRef<
  React.ElementRef<typeof RadixScrollArea.Root>,
  React.ComponentPropsWithoutRef<typeof RadixScrollArea.Root>
>(({ className, children, ...props }, ref) => (
  <RadixScrollArea.Root ref={ref} className={cx("relative overflow-hidden", className)} {...props}>
    <style
      dangerouslySetInnerHTML={{
        // Reference: https://github.com/radix-ui/primitives/issues/926
        __html: `[data-radix-scroll-area-viewport] > div[style] { display: block !important; }`,
      }}
    />
    <RadixScrollArea.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </RadixScrollArea.Viewport>
    <Scrollbar />
    <RadixScrollArea.Corner />
  </RadixScrollArea.Root>
))

ScrollArea.displayName = RadixScrollArea.Root.displayName

const Scrollbar = React.forwardRef<
  React.ElementRef<typeof RadixScrollArea.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof RadixScrollArea.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <RadixScrollArea.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cx(
      "z-10 flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-3 border-l border-l-transparent p-0.5 coarse:w-2",
      orientation === "horizontal" && "h-3 border-t border-t-transparent p-0.5 coarse:w-2",
      className,
    )}
    {...props}
  >
    <RadixScrollArea.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </RadixScrollArea.ScrollAreaScrollbar>
))

Scrollbar.displayName = RadixScrollArea.ScrollAreaScrollbar.displayName
