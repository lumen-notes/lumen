import { cx } from "../utils/cx"
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
    <details open={defaultOpen} className={cx("group/details space-y-4", className)}>
      {children}
    </details>
  )
}

function Summary({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <summary
      className={cx(
        "group/summary -m-4 font-sans font-bold inline-flex cursor-pointer list-none self-start rounded p-4  outline-none [&::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <span className="flex select-none items-center gap-2 rounded px-1 leading-5 text-text-secondary  group-hover/summary:text-text group-focus-visible/summary:text-text group-focus-visible/summary:outline group-focus-visible/summary:outline-2 group-focus-visible/summary:outline-border-focus">
        <TriangleRightIcon12 className="transition-transform group-open/details:rotate-90" />
        {children}
      </span>
    </summary>
  )
}

export const Details = Object.assign(Root, { Summary })
