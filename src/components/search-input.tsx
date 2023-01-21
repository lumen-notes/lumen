import React from "react"
import { IconButton } from "./button"
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
      <div className="absolute top-0 bottom-0 left-4 flex items-center text-text-secondary">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className="focus-ring w-full rounded-md bg-bg-secondary px-4 py-3 pl-[2.75rem] [font-variant-numeric:inherit] [-webkit-appearance:none] placeholder:text-text-secondary focus-visible:bg-bg"
        type="search"
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      {shortcut && !props.value ? (
        <div
          aria-hidden
          className="absolute top-0 bottom-0 right-4 flex items-center coarse:hidden"
        >
          <Keys keys={shortcut} />
        </div>
      ) : null}
      {props.value ? (
        <div
          aria-hidden
          className="absolute top-0 bottom-0 right-0 grid aspect-square place-items-center"
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
