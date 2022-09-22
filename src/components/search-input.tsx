import React from "react"
import { Card } from "./card"
import { SearchIcon16 } from "./icons"

type SearchInputProps = React.ComponentPropsWithoutRef<"input">

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>((props, ref) => {
  return (
    <Card className="relative">
      <div className="absolute top-0 bottom-0 left-4 flex items-center text-text-muted">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className="w-full rounded-lg bg-transparent px-4 py-3 pl-[44px] [font-variant-numeric:inherit] placeholder:text-text-placeholder"
        type="search"
        {...props}
      />
    </Card>
  )
})
