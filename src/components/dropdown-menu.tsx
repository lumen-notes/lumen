import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import { clsx } from "clsx"
import React from "react"
import { Card } from "./card"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

const Content = React.forwardRef<HTMLDivElement, RadixDropdownMenu.DropdownMenuContentProps>(
  ({ children, ...props }, ref) => (
    <RadixDropdownMenu.Content ref={ref} asChild align="start" sideOffset={4} {...props}>
      <Card elevation={1} className="z-10 min-w-[160px] p-1">
        {children}
      </Card>
    </RadixDropdownMenu.Content>
  ),
)

type ItemProps = RadixDropdownMenu.DropdownMenuItemProps & {
  shortcut?: string
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, shortcut, children, ...props }, ref) => (
    <RadixDropdownMenu.Item
      ref={ref}
      className={clsx(
        "flex cursor-default gap-4 rounded py-2 px-3 leading-[16px] outline-none focus:bg-bg-hover focus:outline-none",
        className,
      )}
      {...props}
    >
      <span className="flex-grow">{children}</span>
      <span className="uppercase text-text-muted">{shortcut}</span>
    </RadixDropdownMenu.Item>
  ),
)

const Separator = () => {
  return <RadixDropdownMenu.Separator className="m-1 h-px bg-border-divider" />
}

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  Separator,
})
