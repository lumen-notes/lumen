import React from "react"
import { parseDate } from "chrono-node"
import { Command } from "cmdk"
import { useDebounce } from "use-debounce"
import { Popover } from "@base-ui/react"
import * as Dialog from "@radix-ui/react-dialog"
import { useSearchNotes } from "../hooks/search-notes"
import { addDays } from "date-fns"
import { toDateString, formatDate, formatDateDistance, formatWeekDistance } from "../utils/date"
import { CalendarDateIcon16, ComposeIcon16, PinFillIcon12 } from "./icons"
import { NoteFavicon } from "./note-favicon"
import { cx } from "../utils/cx"

type NotePickerProps = {
  placeholder?: string
  size?: "small" | "large"
  exclude?: string[]
  onSelect: (noteId: string) => void
  onCreateNote?: (title: string) => void
  onClose: () => void
}

type Item = {
  value: string
  label: React.ReactNode
  icon: React.ReactNode
  description?: React.ReactNode
  onSelect: () => void
}

export function NotePicker({
  placeholder = "Search…",
  size = "small",
  exclude = [],
  onSelect,
  onCreateNote,
  onClose,
}: NotePickerProps) {
  const searchNotes = useSearchNotes()
  const [query, setQuery] = React.useState("")
  const [deferredQuery] = useDebounce(query, 150)

  const items = React.useMemo(() => {
    const result: Item[] = []

    if (!deferredQuery) {
      const today = toDateString(new Date())
      const tomorrow = toDateString(addDays(new Date(), 1))
      for (const id of [today, tomorrow]) {
        if (exclude.includes(id)) continue
        result.push({
          value: id,
          label: formatDate(id),
          icon: <CalendarDateIcon16 date={new Date(id).getUTCDate()} />,
          description: formatDateDistance(id),
          onSelect: () => { onSelect(id); onClose() },
        })
      }
    }

    const parsedDate = parseDate(deferredQuery)
    const dateString = parsedDate ? toDateString(parsedDate) : ""
    if (dateString && !exclude.includes(dateString)) {
      result.push({
        value: dateString,
        label: formatDate(dateString),
        icon: <CalendarDateIcon16 date={parsedDate?.getDate()} />,
        description: formatDateDistance(dateString),
        onSelect: () => { onSelect(dateString); onClose() },
      })
    }

    const resultIds = new Set(result.map((i) => i.value))
    const searchResults = searchNotes(deferredQuery)
      .filter((note) => !exclude.includes(note.id) && !resultIds.has(note.id))
      .slice(0, 8)

    for (const note of searchResults) {
      result.push({
        value: note.id,
        label: note.pinned ? <span className="inline-flex gap-2 items-center">{note.displayName}</span> : note.displayName,
        icon: <NoteFavicon note={note} />,
        description:
          note.type === "daily"
            ? formatDateDistance(note.id)
            : note.type === "weekly"
              ? formatWeekDistance(note.id)
              : note.pinned ? <PinFillIcon12 className="text-text-pinned" /> : null,
        onSelect: () => { onSelect(note.id); onClose() },
      })
    }

    if (deferredQuery && onCreateNote) {
      result.push({
        value: "__create__",
        label: `Create new note "${deferredQuery}"`,
        icon: <ComposeIcon16 />,
        onSelect: () => { onCreateNote(deferredQuery); onClose() },
      })
    }

    return result.slice(0, 5)
  }, [deferredQuery, exclude, searchNotes, onCreateNote, onSelect, onClose])

  return (
    <Command
      shouldFilter={false}
      className="overflow-hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !query) {
          onClose()
          event.preventDefault()
        }
      }}
    >
      <Command.Input
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        autoFocus
        className={cx(
          "placeholder:text-text-tertiary w-full outline-none border-b border-border-secondary",
          size === "small" && "px-4 h-10",
          size === "large" && "bg-transparent px-5 py-4 text-lg leading-none",
        )}
      />
      <Command.List
        className={cx(
          "max-h-[min(400px,42vh)] overflow-y-auto overflow-x-hidden",
          size === "small" && "p-1 scroll-py-1",
          size === "large" && "p-2 scroll-py-2",
        )}
      >
        {items.map((item) => (
          <CommandItem
            key={item.value}
            value={item.value}
            icon={item.icon}
            description={item.description}
            onSelect={item.onSelect}
            size={size}
          >
            {item.label}
          </CommandItem>
        ))}
      </Command.List>
    </Command>
  )
}

type CommandItemProps = {
  children: React.ReactNode
  value?: string
  icon?: React.ReactNode
  description?: React.ReactNode
  onSelect?: () => void
  size?: "small" | "large"
}

function CommandItem({
  children,
  value,
  icon,
  description,
  onSelect,
  size = "small",
}: CommandItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cx(
        "flex items-center gap-3 cursor-pointer select-none rounded aria-selected:bg-bg-hover",
        "epaper:aria-selected:bg-text epaper:aria-selected:text-bg epaper:aria-selected:[&_svg]:text-bg",
        size === "small" && "h-8 px-3",
        size === "large" && "h-10 px-3",
      )}
    >
      <div className="grid h-4 w-4 place-items-center text-text-secondary">{icon}</div>
      <div className="grow truncate">{children}</div>
      {description ? <span className="shrink-0 text-text-secondary">{description}</span> : null}
    </Command.Item>
  )
}

type NotePickerPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: React.ReactElement
  placeholder?: string
  exclude?: string[]
  onSelect: (noteId: string) => void
  onCreateNote?: (title: string) => void
}

export function NotePickerPopover({
  open,
  onOpenChange,
  trigger,
  placeholder,
  exclude,
  onSelect,
  onCreateNote,
}: NotePickerPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger render={trigger} />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup
            className={cx(
              "card-2 z-20 w-sm grid place-items-stretch rounded-lg print:hidden outline-hidden",
              "origin-(--transform-origin) transition-[transform,scale,opacity] epaper:transition-none",
              "data-ending-style:scale-95 data-ending-style:opacity-0",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
            )}
          >
            <NotePicker
              size="small"
              placeholder={placeholder}
              exclude={exclude ?? []}
              onSelect={onSelect}
              onCreateNote={onCreateNote}
              onClose={() => onOpenChange(false)}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

type NotePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  placeholder?: string
  exclude?: string[]
  onSelect: (noteId: string) => void
  onCreateNote?: (title: string) => void
}

export function NotePickerDialog({
  open,
  onOpenChange,
  placeholder,
  exclude,
  onSelect,
  onCreateNote,
}: NotePickerDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20" />
        <Dialog.Content
          className="card-3 rounded-xl! fixed left-1/2 top-3 z-20 w-[calc(100vw-24px)] max-w-2xl -translate-x-1/2 overflow-hidden focus:outline-hidden sm:top-[10vh]"
          aria-label="Move task to note"
        >
          <NotePicker
            size="large"
            placeholder={placeholder}
            exclude={exclude ?? []}
            onSelect={onSelect}
            onCreateNote={onCreateNote}
            onClose={() => onOpenChange(false)}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
