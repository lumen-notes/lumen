import { createContext, useContext } from "react"
import { cx } from "../utils/cx"
import { Button, ButtonProps } from "./button"
import React from "react"

export type SegmentedControlProps = {
  "aria-label"?: string
  size?: "small" | "medium"
  className?: string
  children: React.ReactNode
}

const SizeContext = createContext<SegmentedControlProps["size"]>("medium")

function Root({
  "aria-label": ariaLabel,
  size = "medium",
  className,
  children,
}: SegmentedControlProps) {
  return (
    <SizeContext.Provider value={size}>
      <ul
        aria-label={ariaLabel}
        className={cx("flex items-center gap-px rounded bg-bg-secondary", className)}
      >
        {children}
      </ul>
    </SizeContext.Provider>
  )
}

type SegmentedControlSegmentProps = Omit<
  ButtonProps,
  "size" | "variant" | "disablePressAnimation"
> & {
  selected?: boolean
}

const Segment = React.forwardRef<HTMLButtonElement, SegmentedControlSegmentProps>(
  ({ className, selected, ...props }, ref) => {
    const size = useContext(SizeContext)
    return (
      <li>
        <Button
          ref={ref}
          size={size}
          aria-current={selected ? "true" : "false"}
          className={cx(
            selected
              ? "cursor-default bg-bg ring-1 ring-inset ring-border hover:bg-bg active:bg-bg"
              : "bg-transparent hover:bg-bg-secondary active:bg-bg-tertiary",
            className,
          )}
          {...props}
        />
      </li>
    )
  },
)

export const SegmentedControl = Object.assign(Root, {
  Segment,
})
