import React from "react"
import { Card } from "./card"
import { SearchIcon16 } from "./icons"

type SearchInputProps = React.ComponentPropsWithoutRef<"input"> & { shortcut?: string }

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ shortcut, ...props }, ref) => {
    return (
      <Card className="relative">
        <div className="absolute top-0 bottom-0 left-4 flex items-center text-text-muted">
          <SearchIcon16 />
        </div>
        {/* Show keyboard shortcut when input is empty */}
        {!props.value ? (
          <div className="absolute top-0 bottom-0 right-4 flex items-center text-text-muted">
            {shortcut}
          </div>
        ) : null}
        <input
          ref={ref}
          className="w-full rounded-lg bg-transparent px-4 py-3 pl-[40px] placeholder:text-text-placeholder"
          type="search"
          {...props}
        />
      </Card>
    )
  },
)
