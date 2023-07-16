import React from "react"
import { IconButton } from "./icon-button"
import { ClearIcon16, SearchIcon16 } from "./icons"
import { Keys } from "./keys"

type SearchInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "onChange"> & {
  shortcut?: string[]
  onChange?: (value: string) => void
}

export function SearchInput({ shortcut = ["⌘", "F"], onChange, ...props }: SearchInputProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <div className="absolute bottom-0 left-4 top-0 flex items-center text-text-secondary">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className="focus-ring h-11 w-full rounded-md bg-bg-secondary px-4 pl-[2.75rem] [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary hover:bg-bg-tertiary focus-visible:bg-bg coarse:h-12"
        type="search"
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      {shortcut && !props.value ? (
        <div
          aria-hidden
          className="absolute bottom-0 right-4 top-0 flex items-center coarse:hidden"
        >
          <Keys keys={shortcut} />
        </div>
      ) : null}
      {props.value ? (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 top-0 grid aspect-square place-items-center"
        >
          <IconButton
            aria-label="Clear"
            tabIndex={-1}
            onClick={() => {
              onChange?.("")
              ref.current?.focus()
            }}
          >
            <ClearIcon16 />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
