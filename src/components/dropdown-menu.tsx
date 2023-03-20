import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Portal from "@radix-ui/react-portal"
import React from "react"
import { cx } from "../utils/cx"
import { Card } from "./card"
import { Keys } from "./keys"

const Root = RadixDropdownMenu.Root

const Trigger = RadixDropdownMenu.Trigger

const Content = React.forwardRef<HTMLDivElement, RadixDropdownMenu.DropdownMenuContentProps>(
  ({ children, ...props }, ref) => (
    <Portal.Root>
      <RadixDropdownMenu.Content ref={ref} asChild align="start" sideOffset={4} {...props}>
        <Card
          elevation={1}
          className="z-20 max-h-[50vh] min-w-[16rem] overflow-auto rounded-md p-1 animate-in fade-in after:rounded-md data-[side=top]:slide-in-from-bottom-2 data-[side=right]:slide-in-from-left-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2"
        >
          {children}
        </Card>
      </RadixDropdownMenu.Content>
    </Portal.Root>
  ),
)

type ItemProps = RadixDropdownMenu.DropdownMenuItemProps &
  React.ComponentPropsWithoutRef<"a"> & {
    icon?: React.ReactNode
    shortcut?: string[]
  }

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, icon, shortcut, href, children, ...props }, ref) => {
    const content = (
      <>
        <div className="flex flex-grow items-center gap-3 coarse:gap-4">
          {icon ? <div className="flex text-text-secondary">{icon}</div> : null}
          <span>{children}</span>
        </div>
        {shortcut ? (
          <div className="flex coarse:hidden">
            <Keys keys={shortcut} />
          </div>
        ) : null}
      </>
    )

    return (
      <RadixDropdownMenu.Item
        ref={ref}
        className={cx(
          "flex h-8 cursor-default items-center gap-5 rounded-sm px-3 leading-4 outline-none focus:bg-bg-secondary focus:outline-none coarse:h-10 coarse:px-4 [&[data-disabled]]:text-text-secondary [&[data-disabled]]:opacity-75",
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
