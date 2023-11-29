import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Portal from "@radix-ui/react-portal"
import React from "react"
import { cx } from "../utils/cx"
import { Card } from "./card"
import { Keys } from "./keys"
import { CheckIcon16 } from "./icons"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

type ContentProps = RadixDropdownMenu.DropdownMenuContentProps & {
  minWidth?: number | string
}

const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ children, minWidth = "16rem", ...props }, ref) => (
    <Portal.Root>
      <RadixDropdownMenu.Content ref={ref} asChild align="start" sideOffset={4} {...props}>
        <Card
          elevation={2}
          className="z-20 overflow-hidden rounded-md animate-in fade-in after:rounded-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          style={{ minWidth }}
        >
          <div className="max-h-[80vh] overflow-auto p-1">{children}</div>
        </Card>
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
            "flex flex-grow items-center gap-3 coarse:gap-4",
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
          <span>{children}</span>
        </div>
        {trailingVisual}
        {shortcut ? (
          <div className="flex coarse:hidden">
            <Keys keys={shortcut} />
          </div>
        ) : null}
        {selected !== undefined ? (
          selected ? (
            <CheckIcon16 className="-m-1 text-text-secondary" />
          ) : (
            <div className="-m-1 h-4 w-4" />
          )
        ) : null}
      </>
    )

    return (
      <RadixDropdownMenu.Item
        ref={ref}
        className={cx(
          "flex h-8 cursor-pointer items-center gap-5 rounded-sm px-3 leading-4 outline-none focus:bg-bg-secondary focus:outline-none active:bg-bg-tertiary data-[disabled]:cursor-default data-[disabled]:opacity-50 coarse:h-10 coarse:px-4",
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
  return <RadixDropdownMenu.Separator className="m-1 h-px bg-border-secondary" />
}

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  Separator,
})
