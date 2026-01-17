import { useCallback } from "react"
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
    <details
      open={defaultOpen}
      className={cx("group/details flex flex-col gap-3 coarse:gap-4", className)}
    >
      {children}
    </details>
  )
}

function Summary({ children, className }: { children: React.ReactNode; className?: string }) {
  const stopPropagationOnDoubleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (event.detail > 1) {
      event.stopPropagation()
    }
  }, [])

  return (
    <summary
      className={cx(
        "group/summary -m-3 coarse:-m-4 font-sans inline-flex cursor-pointer list-none self-start rounded p-3 coarse:p-4 outline-hidden [&::-webkit-details-marker]:hidden",
        className,
      )}
      onMouseDown={stopPropagationOnDoubleClick}
    >
      <div className="flex px-2 -mx-2 py-0.5 select-none items-center text-text-secondary rounded gap-1.5 leading-5 group-hover/summary:text-text group-focus-visible/summary:outline group-focus-visible/summary:outline-2 group-focus-visible/summary:outline-border-focus group-focus-visible/summary:-outline-offset-2">
        {children}
        <ChevronRightIcon12 className="transition-transform group-open/details:rotate-90" />
      </div>
    </summary>
  )
}

export const Details = Object.assign(Root, { Summary })
