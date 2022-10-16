import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import { clsx } from "clsx"
import React from "react"
import { Card } from "./card"
import { Keys } from "./keys"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

const Content = React.forwardRef<HTMLDivElement, RadixDropdownMenu.DropdownMenuContentProps>(
  ({ children, ...props }, ref) => (
    <RadixDropdownMenu.Content ref={ref} asChild align="start" sideOffset={4} {...props}>
      <Card elevation={1} className="z-20 min-w-[10rem] p-1">
        {children}
      </Card>
    </RadixDropdownMenu.Content>
  ),
)

type ItemProps = RadixDropdownMenu.DropdownMenuItemProps & {
  shortcut?: string[]
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, shortcut, children, ...props }, ref) => (
    <RadixDropdownMenu.Item
      ref={ref}
      className={clsx(
        "flex cursor-default gap-4 rounded py-2 px-3 leading-4 outline-none focus:bg-bg-hover focus:outline-none [&[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex-grow">{children}</span>
      {shortcut ? <Keys keys={shortcut} /> : null}
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
