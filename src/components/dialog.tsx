import * as RadixDialog from "@radix-ui/react-dialog"
import { cx } from "../utils/cx"
import React from "react"
import { IconButton } from "./icon-button"
import { XIcon16 } from "./icons"

const Root = RadixDialog.Root

const Trigger = RadixDialog.Trigger

const Close = RadixDialog.Close

type DialogContentProps = RadixDialog.DialogContentProps & {
  title: React.ReactNode
}

const Content = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ title, className, children, ...props }, ref) => {
    return (
      <RadixDialog.Portal>
        <RadixDialog.Content
          className={cx(
            "card-3 !rounded-xl fixed left-1/2 top-2 z-20 max-h-[75vh] w-[calc(100vw_-_1rem)] max-w-md -translate-x-1/2 focus:outline-none sm:top-[10vh] overflow-hidden grid grid-rows-[auto_1fr]",
            className,
          )}
          {...props}
        >
          <div className="flex items-center justify-between h-12 px-4 border-b border-border-secondary">
            <RadixDialog.Title className="font-bold">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton
                aria-label="Close"
                className="-m-2 coarse:-m-3 coarse:rounded-lg"
                disableTooltip
              >
                <XIcon16 />
              </IconButton>
            </RadixDialog.Close>
          </div>
          <div className="overflow-auto p-4">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    )
  },
)

export const Dialog = Object.assign(Root, {
  Trigger,
  Close,
  Content,
})
