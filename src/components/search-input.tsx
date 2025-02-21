import React from "react"
import { useValueRef } from "../hooks/value-ref"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ClearIcon16, SearchIcon16 } from "./icons"
import { Keys } from "./keys"

type SearchInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "onChange"> & {
  shortcut?: string[]
  onChange?: (value: string) => void
}

export function SearchInput({
  shortcut,
  placeholder = "Search…",
  value,
  onChange,
  ...props
}: SearchInputProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState(value || "")
  const inputValueRef = useValueRef(inputValue)

  React.useEffect(() => {
    if (value !== inputValueRef.current) {
      setInputValue(value || "")
    }
  }, [value, inputValueRef])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value
    setInputValue(newValue)
    onChange?.(newValue)
  }

  function clearInput() {
    setInputValue("")
    onChange?.("")
    ref.current?.focus()
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 grid aspect-square place-items-center text-text-secondary">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className={cx(
          "focus-ring h-10 w-full rounded-lg bg-bg-secondary pl-10 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary coarse:h-12 coarse:pl-12 [&:not(:focus-visible)]:hover:ring-1 [&:not(:focus-visible)]:hover:ring-inset [&:not(:focus-visible)]:hover:ring-border-secondary",
          "eink:ring-1 eink:ring-inset eink:ring-border eink:focus-visible:ring-2",
          value ? "pr-10 coarse:pr-12" : "pr-3 coarse:pr-4",
        )}
        type="search"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
      {shortcut && !inputValue ? (
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 flex items-center pr-3 coarse:hidden"
        >
          <Keys keys={shortcut} />
        </div>
      ) : null}
      {inputValue ? (
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 grid aspect-square place-items-center"
        >
          <IconButton aria-label="Clear" tabIndex={-1} onClick={clearInput}>
            <ClearIcon16 />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
