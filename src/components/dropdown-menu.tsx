import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Portal from "@radix-ui/react-portal"
import React from "react"
import { cx } from "../utils/cx"
import { CheckIcon16 } from "./icons"
import { Keys } from "./keys"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

type ContentProps = RadixDropdownMenu.DropdownMenuContentProps & {
  width?: number | string
}

const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ children, width = 256, className, ...props }, ref) => (
    <Portal.Root>
      <RadixDropdownMenu.Content
        ref={ref}
        align="start"
        sideOffset={4}
        {...props}
        className={cx(
          "card-2 place-items-strech z-20 grid overflow-hidden rounded-lg animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95",
          // Set transform-origin for every combination of side and align
          "data-[side=bottom]:data-[align=center]:origin-top",
          "data-[side=bottom]:data-[align=end]:origin-top-right",
          "data-[side=bottom]:data-[align=start]:origin-top-left",
          "data-[side=left]:data-[align=center]:origin-right",
          "data-[side=left]:data-[align=end]:origin-bottom-right",
          "data-[side=left]:data-[align=start]:origin-top-right",
          "data-[side=right]:data-[align=center]:origin-left",
          "data-[side=right]:data-[align=end]:origin-bottom-left",
          "data-[side=right]:data-[align=start]:origin-top-left",
          "data-[side=top]:data-[align=center]:origin-bottom",
          "data-[side=top]:data-[align=end]:origin-bottom-right",
          "data-[side=top]:data-[align=start]:origin-bottom-left",
          className,
        )}
        style={{ width: width }}
      >
        <div className="grid max-h-[60svh] scroll-py-1 overflow-auto p-1">{children}</div>
      </RadixDropdownMenu.Content>
    </Portal.Root>
  ),
)

type ItemProps = RadixDropdownMenu.DropdownMenuItemProps &
  React.ComponentPropsWithoutRef<"a"> & {
    icon?: React.ReactNode
    shortcut?: string[]
    trailingVisual?: React.ReactNode
    variant?: "default" | "danger"
    selected?: boolean
  }

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  (
    { className, icon, shortcut, trailingVisual, variant, selected, href, children, ...props },
    ref,
  ) => {
    const content = (
      <>
        <div
          className={cx(
            "flex w-0 flex-grow items-center gap-3",
            variant === "danger" && "text-text-danger",
          )}
        >
          {icon ? (
            <div
              className={cx("flex text-text-secondary", variant === "danger" && "text-text-danger")}
            >
              {icon}
            </div>
          ) : null}
          <span className="truncate">{children}</span>
        </div>
        {trailingVisual}
        {shortcut ? (
          <div className="flex coarse:hidden">
            <Keys keys={shortcut} />
          </div>
        ) : null}
        {selected !== undefined ? selected ? <CheckIcon16 /> : <div className="h-4 w-4" /> : null}
      </>
    )

    return (
      <RadixDropdownMenu.Item
        ref={ref}
        className={cx(
          "flex h-8 cursor-pointer select-none items-center gap-3 rounded px-3 leading-4 outline-none focus:bg-bg-secondary focus:outline-none active:bg-bg-tertiary data-[disabled]:cursor-default data-[disabled]:opacity-50 data-[disabled]:active:bg-transparent coarse:h-10",
          className,
        )}
        asChild={Boolean(href)}
        {...props}
      >
        {href ? <a href={href}>{content}</a> : content}
      </RadixDropdownMenu.Item>
    )
  },
)

const Separator = () => {
  return <RadixDropdownMenu.Separator className="mx-3 my-1 h-px bg-border-secondary" />
}

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  Separator,
})
