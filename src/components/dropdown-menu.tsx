import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import { clsx } from "clsx"
import React from "react"
import { Card } from "./card"
import { Keys } from "./keys"
import * as Portal from "@radix-ui/react-portal"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

const Content = React.forwardRef<HTMLDivElement, RadixDropdownMenu.DropdownMenuContentProps>(
  ({ children, ...props }, ref) => (
    <Portal.Root>
      <RadixDropdownMenu.Content ref={ref} asChild align="start" sideOffset={4} {...props}>
        <Card elevation={1} className="z-20 min-w-[14rem] p-1">
          {children}
        </Card>
      </RadixDropdownMenu.Content>
    </Portal.Root>
  ),
)

type ItemProps = RadixDropdownMenu.DropdownMenuItemProps & {
  icon?: React.ReactNode
  shortcut?: string[]
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, icon, shortcut, children, ...props }, ref) => (
    <RadixDropdownMenu.Item
      ref={ref}
      className={clsx(
        "flex cursor-default gap-5 rounded py-2 px-3 leading-4 outline-none focus:bg-bg-secondary focus:outline-none touch:py-3 touch:px-4 [&[data-disabled]]:opacity-50",
        className,
      )}
      {...props}
    >
      <div className="flex flex-grow items-center gap-3">
        {icon ? <div className="flex text-text-secondary">{icon}</div> : null}
        <span>{children}</span>
      </div>
      {shortcut ? <Keys keys={shortcut} /> : null}
    </RadixDropdownMenu.Item>
  ),
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
