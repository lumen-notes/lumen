import { useCallback } from "react"
import { Collapsible } from "@base-ui/react/collapsible"
import { cx } from "../utils/cx"
import { ChevronRightIcon12 } from "./icons"

function Root({
  children,
  className,
  defaultOpen = true,
}: {
  children: React.ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      className={cx("group/details flex flex-col gap-3 coarse:gap-4", className)}
    >
      {children}
    </Collapsible.Root>
  )
}

function Summary({ children, className }: { children: React.ReactNode; className?: string }) {
  const stopPropagationOnDoubleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (event.detail > 1) {
      event.stopPropagation()
    }
  }, [])

  return (
    <Collapsible.Trigger
      className={cx(
        "group/summary -m-3 coarse:-m-4 font-sans inline-flex cursor-pointer list-none self-start rounded p-3 coarse:p-4 outline-hidden",
        className,
      )}
      onMouseDown={stopPropagationOnDoubleClick}
    >
      <div className="flex px-2 -mx-2 py-0.5 select-none items-center text-text-secondary rounded gap-1.5 leading-5 group-hover/summary:text-text group-focus-visible/summary:outline group-focus-visible/summary:outline-2 group-focus-visible/summary:outline-border-focus group-focus-visible/summary:-outline-offset-2">
        {children}
        <span className="transition-transform duration-150 group-data-[panel-open]/summary:rotate-90">
          <ChevronRightIcon12 />
        </span>
      </div>
    </Collapsible.Trigger>
  )
}

function Content({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Collapsible.Panel
      className={cx(
        "h-0 overflow-hidden transition-[height] duration-150 ease-in-out data-[open]:h-[var(--collapsible-panel-height)]",
        className,
      )}
    >
      {children}
    </Collapsible.Panel>
  )
}

export const Details = Object.assign(Root, { Summary, Content })
