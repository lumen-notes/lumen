import React from "react"
import { SearchIcon16 } from "./icons"

type SearchInputProps = React.ComponentPropsWithoutRef<"input">

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => {
  return (
    <div className="relative">
      <div className="absolute top-0 bottom-0 left-4 flex items-center text-text-muted">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className="w-full rounded-lg bg-bg-hover px-4 py-3 pl-[2.75rem] [font-variant-numeric:inherit] placeholder:text-text-placeholder focus:bg-bg"
        type="search"
        {...props}
      />
    </div>
  )
})
