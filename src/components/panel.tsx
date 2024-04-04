import React from "react"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CloseIcon16, MoreIcon16 } from "./icons"
import { cx } from "../utils/cx"

type PanelProps = {
  // TODO: Remove `id` prop
  id?: string
  className?: string
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  onClose?: () => void
}

export function Panel({
  className,
  title,
  description,
  icon,
  actions,
  children,
  onClose,
}: PanelProps) {
  return (
    <div className={cx("grid h-full grid-rows-[auto_1fr]", className)}>
      <div
        className={
          "flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border-secondary bg-bg-inset p-2 pl-4 coarse:h-14"
        }
      >
        <div className="flex flex-shrink items-center gap-3">
          <div className="flex-shrink-0 text-text-secondary">{icon}</div>
          <div className="flex items-baseline gap-3 overflow-hidden">
            <h2 className="flex-shrink-0 text-lg font-semibold leading-6">{title}</h2>
            {description ? (
              <span className="truncate text-text-secondary">{description}</span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {actions ? (
            <DropdownMenu modal={false}>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="Panel actions" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">{actions}</DropdownMenu.Content>
            </DropdownMenu>
          ) : null}
          {onClose ? (
            <IconButton aria-label="Close" shortcut={["⌘", "X"]} onClick={() => onClose()}>
              <CloseIcon16 />
            </IconButton>
          ) : null}
        </div>
      </div>
      <div className="h-full scroll-pb-4 scroll-pt-4 overflow-auto fine:lg:[scrollbar-gutter:stable_both-edges]">
        {children}
      </div>
    </div>
  )
}
