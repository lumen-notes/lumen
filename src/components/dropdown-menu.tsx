import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import React from "react"
import { clsx } from "clsx"
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

const Item = React.forwardRef<HTMLDivElement, RadixDropdownMenu.DropdownMenuItemProps>(
  ({ className, ...props }, ref) => (
    <RadixDropdownMenu.Item
      ref={ref}
      className={clsx(
        "block cursor-default rounded py-2 px-3 leading-[16px] outline-none focus:bg-bg-hover focus:outline-none",
        className,
      )}
      {...props}
    />
  ),
)

export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
})
