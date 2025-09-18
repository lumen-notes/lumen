import { Link } from "@tanstack/react-router"
import { isToday } from "date-fns"
import { useCallback, useRef, useState } from "react"
import { z } from "zod"
import {
  formatDate,
  formatDateDistance,
  getNextBirthday,
  MONTH_NAMES,
  toDateString,
  toDateStringUtc,
} from "../utils/date"
import { Checkbox } from "./checkbox"
import { DateLink } from "./date-link"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"
import { TagLink } from "./tag-link"

type PropertyValueProps = {
  property: [string, unknown]
  onChange?: (value: unknown) => void
}

export function PropertyValue({ property: [key, value], onChange }: PropertyValueProps) {
  // Special keys
  switch (key) {
    case "isbn":
      if (!value || (typeof value !== "string" && typeof value !== "number")) break
      return (
        <div>
          <a
            className="link link-external"
            href={`https://openlibrary.org/isbn/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {`${value}`}
          </a>
        </div>
      )

    case "birthday": {
      // Skip if value is not a date or string in the format "MM-DD"
      if (!(value instanceof Date || (typeof value === "string" && /^\d{2}-\d{2}$/.test(value)))) {
        break
      }

      const year = value instanceof Date ? value.getUTCFullYear() : null
      const month = value instanceof Date ? value.getUTCMonth() : parseInt(value.split("-")[0]) - 1
      const day = value instanceof Date ? value.getUTCDate() : parseInt(value.split("-")[1])
      const dateString = value instanceof Date ? toDateStringUtc(value) : null

      const nextBirthday = getNextBirthday(new Date(year ?? 0, month, day))
      const nextBirthdayString = toDateString(nextBirthday)
      const nextAge = year ? nextBirthday.getUTCFullYear() - year : null
      const isBirthdayToday = isToday(nextBirthday)

      return (
        <span>
          {dateString ? (
            <Link
              className="link"
              to="/notes/$"
              params={{ _splat: dateString }}
              search={{
                mode: "read",
                query: undefined,
                view: "grid",
              }}
            >
              {formatDate(dateString, { excludeDayOfWeek: true })}
            </Link>
          ) : (
            <span>
              {MONTH_NAMES[month].slice(0, 3)} {day}
            </span>
          )}
          <span className="mx-2 text-text-secondary">·</span>
          <span className="text-text-secondary">
            {nextAge ? `${withSuffix(nextAge)} birthday` : "Birthday"} is{" "}
            <Link
              className="link"
              to="/notes/$"
              params={{ _splat: nextBirthdayString }}
              search={{
                mode: "read",
                query: undefined,
                view: "grid",
              }}
            >
              {formatDateDistance(toDateStringUtc(nextBirthday)).toLowerCase()}
            </Link>{" "}
            {isBirthdayToday ? "🎂" : null}
          </span>
        </span>
      )
    }

    case "tags": {
      const tagsSchema = z.array(z.string().regex(/^[\p{L}][\p{L}\p{N}_\-/]*$/u))
      const parsedTags = tagsSchema.safeParse(value)
      if (!parsedTags.success) break

      return (
        <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
          {parsedTags.data.map((tag) => (
            <TagLink key={tag} name={tag} />
          ))}
        </span>
      )
    }
  }

  // If value is a string, render it as markdown
  if (typeof value === "string") {
    return <Markdown fontSize="small">{value}</Markdown>
  }

  // If value is a boolean, render it as a checkbox
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center h-7">
        <Checkbox checked={value} onCheckedChange={(checked) => onChange?.(checked === true)} />
      </div>
    )
  }

  // If value is a date, render it as a link to the date page
  if (value instanceof Date) {
    const dateString = toDateStringUtc(value)
    return (
      <div>
        <DateLink className="link" date={dateString} />
      </div>
    )
  }

  // If value is a list of strings or numbers, render it as a markdown list
  if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number")) {
    return (
      <div className="flex flex-col gap-1">
        {value.map((v, i) => (
          <Markdown key={`${i}-${v}`} fontSize="small">
            {String(v)}
          </Markdown>
        ))}
      </div>
    )
  }

  return <code>{JSON.stringify(value)}</code>
}

/** Adds the appropriate suffix to a number (e.g. "1st", "2nd", "3rd", "4th", etc.) */
function withSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`
  }

  switch (lastDigit) {
    case 1:
      return `${num}st`
    case 2:
      return `${num}nd`
    case 3:
      return `${num}rd`
    default:
      return `${num}th`
  }
}

type PropertyValueEditorProps = {
  property: [string, unknown]
  onChange: (value: unknown) => void
}

export function PropertyValueEditor({
  property: [key, value],
  onChange,
}: PropertyValueEditorProps) {
  const [mode, setMode] = useState<"read" | "write">("read")
  const buttonRef = useRef<HTMLDivElement>(null)
  const lastPointerDownTimeRef = useRef(0)
  const lastPointerOnInteractiveRef = useRef(false)
  const skipFocusWriteRef = useRef(false)

  // Prevent double-clicks inside the property editor from bubbling to the page,
  // which would otherwise toggle full-page write mode.
  const stopPropagationOnDoubleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.detail > 1) {
      event.stopPropagation()
    }
  }, [])

  const handleBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const nextFocusTarget = event.relatedTarget as Node | null
    // Only switch back to read mode if focus moves outside this editor.
    // Defer the state update so the browser can complete the focus change first,
    // avoiding lost keystrokes in the newly focused field.
    if (!event.currentTarget.contains(nextFocusTarget)) {
      setTimeout(() => setMode("read"))
    }
  }, [])

  const handleButtonClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    // If the click originated inside any interactive descendant (links, buttons,
    // inputs, editable content, etc.), let that element handle it so that
    // in-value links remain clickable and embedded controls work as expected.
    if (
      target?.closest(
        "a,button,input,textarea,select,summary,[contenteditable='true'],[contenteditable='']",
      )
    ) {
      return
    }

    setMode("write")
  }, [])

  const handleButtonPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    lastPointerDownTimeRef.current = Date.now()
    const target = event.target as HTMLElement | null
    lastPointerOnInteractiveRef.current = !!target?.closest(
      "a,button,input,textarea,select,summary,[contenteditable='true'],[contenteditable='']",
    )
  }, [])

  const handleButtonKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setMode("write")
    }
  }, [])

  const handleButtonFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (skipFocusWriteRef.current) {
      skipFocusWriteRef.current = false
      return
    }
    const timeSincePointerMs = Date.now() - lastPointerDownTimeRef.current
    // Only switch to write on focus if it was not caused by a recent pointer
    // interaction (touch/mouse). This preserves link taps on mobile.
    if (timeSincePointerMs > 400 && !lastPointerOnInteractiveRef.current) {
      setMode("write")
    }
  }, [])

  if (
    onChange &&
    (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
  ) {
    return (
      <div className="min-h-8 coarse:min-h-10">
        {mode === "read" ? (
          <div
            ref={buttonRef}
            role="button"
            tabIndex={0}
            className="leading-7 focus-ring hover:ring-inset hover:ring-1 cursor-text hover:ring-border px-2 py-0.5 coarse:px-3 coarse:py-1.5 w-full text-left rounded"
            onMouseDown={stopPropagationOnDoubleClick}
            onPointerDown={handleButtonPointerDown}
            onClick={handleButtonClick}
            onKeyDown={handleButtonKeyDown}
            onFocus={handleButtonFocus}
          >
            <PropertyValue property={[key, value]} onChange={onChange} />
          </div>
        ) : null}
        {mode === "write" ? (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus, jsx-a11y/no-noninteractive-element-interactions
          <div
            className="focus-within:ring-2 focus-within:ring-inset focus-within:ring-border-focus rounded"
            onMouseDown={stopPropagationOnDoubleClick}
            onBlur={handleBlur}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !event.metaKey && !event.ctrlKey) {
                event.preventDefault()
                event.stopPropagation()
                setMode("read")
                setTimeout(() => {
                  skipFocusWriteRef.current = true
                  buttonRef.current?.focus()
                  setTimeout(() => {
                    skipFocusWriteRef.current = false
                  })
                })
              }
            }}
          >
            <NoteEditor
              defaultValue={String(value)}
              placeholder=""
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={true}
              className="px-2 py-0.5 coarse:px-3 coarse:py-1.5"
              indentWithTab={false}
              onChange={(text) => {
                const parsed = parsePrimitiveFromString(text)
                onChange(parsed)
              }}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="px-2 py-0.5 coarse:px-3 coarse:py-1.5 leading-7">
      <PropertyValue property={[key, value]} />
    </div>
  )
}

/**
 * Coerce a string input to a boolean when it is "true"/"false" (case-insensitive),
 * otherwise to a number when it is a valid numeric literal. Returns the original
 * string when neither case applies.
 */
function parsePrimitiveFromString(input: string): string | number | boolean {
  const trimmed = input.trim()
  if (trimmed === "") return input

  const lower = trimmed.toLowerCase()
  if (lower === "true") return true
  if (lower === "false") return false

  // Match optional sign, integer or decimal (with optional leading/trailing digits), optional exponent
  const numericPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/
  if (numericPattern.test(trimmed)) {
    const n = Number(trimmed)
    if (Number.isFinite(n)) {
      // Avoid silent precision loss for integers beyond JS safe range
      if (Number.isInteger(n) && !Number.isSafeInteger(n)) return input
      return n
    }
  }

  return input
}
