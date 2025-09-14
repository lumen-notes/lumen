import { cx } from "../utils/cx"
import { useCallback } from "react"
import { TriangleRightIcon12 } from "./icons"

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
      className={cx("group/details space-y-3 coarse:space-y-4", className)}
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
        "group/summary -m-3 coarse:-m-4 font-sans font-bold inline-flex cursor-pointer list-none self-start rounded p-3 coarse:p-4 outline-none [&::-webkit-details-marker]:hidden",
        className,
      )}
      onMouseDown={stopPropagationOnDoubleClick}
    >
      <div className="flex select-none items-center text-text-secondary rounded gap-2 -ml-1 leading-5">
        <div className="p-1 flex group-hover/summary:bg-bg-hover group-active/summary:bg-bg-active rounded-full group-focus-visible/summary:text-text group-focus-visible/summary:outline group-focus-visible/summary:outline-2 group-focus-visible/summary:outline-border-focus group-focus-visible/summary:-outline-offset-2">
          <TriangleRightIcon12 className="transition-transform group-open/details:rotate-90 " />
        </div>
        {children}
      </div>
    </summary>
  )
}

export const Details = Object.assign(Root, { Summary })
