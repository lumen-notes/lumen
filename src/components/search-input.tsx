import React from "react"
import { SearchIcon16 } from "./icons"
import { Keys } from "./keys"

type SearchInputProps = React.ComponentPropsWithoutRef<"input"> & {
  shortcut?: string[]
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ shortcut = ["⌘", "F"], ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-4 flex items-center text-text-muted">
          <SearchIcon16 />
        </div>
        <input
          ref={ref}
          className="w-full rounded-lg bg-bg-secondary px-4 py-3 pl-[2.75rem] [font-variant-numeric:inherit] placeholder:text-text-muted focus:bg-bg"
          type="search"
          {...props}
        />
        {shortcut && !props.value ? (
          <div aria-hidden className="absolute top-0 bottom-0 right-4 flex items-center">
            <Keys keys={shortcut} />
          </div>
        ) : null}
      </div>
    )
  },
)
