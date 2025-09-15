import React, { useCallback, useRef, useState } from "react"

type PropertyKeyEditorProps = {
  name: string
  onChange?: (name: string) => void
}

export function PropertyKeyEditor({ name, onChange }: PropertyKeyEditorProps) {
  const [mode, setMode] = useState<"read" | "write">("read")
  const buttonRef = useRef<HTMLButtonElement>(null)

  const stopPropagationOnDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLInputElement>) => {
      if (event.detail > 1) {
        event.stopPropagation()
      }
    },
    [],
  )

  return (
    <div className="truncate font-mono leading-7">
      {mode === "read" ? (
        <button
          ref={buttonRef}
          className="text-text-secondary truncate focus-ring py-0.5 px-2 coarse:px-3 coarse:py-1.5 hover:ring-inset hover:ring-1 cursor-text hover:ring-border w-full text-left rounded"
          onMouseDown={stopPropagationOnDoubleClick}
          onClick={() => setMode("write")}
          onFocus={() => setMode("write")}
        >
          {name}
        </button>
      ) : null}
      {mode === "write" ? (
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          type="text"
          defaultValue={name}
          className="w-full rounded px-2 py-0.5 bg-transparent coarse:px-3 coarse:py-1.5 outline-none ring-2 ring-inset ring-border-focus"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={(event) => onChange?.(event.target.value)}
          onMouseDown={stopPropagationOnDoubleClick}
          onBlur={() => setMode("read")}
        />
      ) : null}
    </div>
  )
}
