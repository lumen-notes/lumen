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
            "card-3 !rounded-xl fixed left-1/2 top-2 z-20 max-h-[85vh] w-[calc(100vw_-_1rem)] max-w-md -translate-x-1/2 overflow-auto focus:outline-none sm:top-[10vh]",
            className,
          )}
          {...props}
        >
          <div className="grid gap-4 p-4">
            <div className="flex items-center justify-between h-4">
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
            <div>{children}</div>
          </div>
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
