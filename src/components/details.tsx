import { cx } from "../utils/cx"
import { TriangleRightIcon8 } from "./icons"

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
        "group/summary -m-4 inline-flex cursor-pointer list-none rounded p-4 text-text-secondary outline-none hover:text-text focus-visible:text-text [&::-webkit-details-marker]:hidden",
        className,
      )}
    >
      <span className="inline-flex select-none items-center gap-2 rounded px-1  group-focus-visible/summary:outline group-focus-visible/summary:outline-2 group-focus-visible/summary:outline-border-focus">
        <TriangleRightIcon8 className="transition-transform duration-150 group-open/details:rotate-90" />
        {children}
      </span>
    </summary>
  )
}

export const Details = Object.assign(Root, { Summary })
