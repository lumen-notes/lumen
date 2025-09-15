import * as RadixSwitch from "@radix-ui/react-switch"
import { Vim } from "@replit/codemirror-vim"
import { createFileRoute } from "@tanstack/react-router"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import ejs from "ejs"
import { useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { useNetworkState } from "react-use"
import useResizeObserver from "use-resize-observer"
import { z } from "zod"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
import { Calendar } from "../components/calendar"
import { DaysOfWeek } from "../components/days-of-week"
import { Details } from "../components/details"
import { DropdownMenu } from "../components/dropdown-menu"
import { IconButton } from "../components/icon-button"
import {
  CenteredIcon16,
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  FullwidthIcon16,
  GlobeIcon16,
  MoreIcon16,
  NoteIcon16,
  PaperclipIcon16,
  PinFillIcon16,
  PinIcon16,
  PrinterIcon16,
  ShareIcon16,
  TrashIcon16,
  UndoIcon16,
} from "../components/icons"
import { DraftIndicator } from "../components/draft-indicator"
import { InsertTemplateDialog, removeFrontmatterComments } from "../components/insert-template"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { NoteFavicon } from "../components/note-favicon"
import { NoteList } from "../components/note-list"
import { PillButton } from "../components/pill-button"
import { SegmentedControl } from "../components/segmented-control"
import { ShareDialog } from "../components/share-dialog"
import { Tooltip } from "../components/tooltip"
import { Tool, voiceConversationMachineAtom } from "../components/voice-conversation"
import {
  dailyTemplateAtom,
  defaultFontAtom,
  githubRepoAtom,
  globalStateMachineAtom,
  isSignedOutAtom,
  weeklyTemplateAtom,
} from "../global-state"
import { useAttachFile } from "../hooks/attach-file"
import { useEditorSettings } from "../hooks/editor-settings"
import { useIsScrolled } from "../hooks/is-scrolled"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { useValueRef } from "../hooks/value-ref"
import { Font, Note, NoteId, Template, Width, fontSchema, widthSchema } from "../schema"
import { cx } from "../utils/cx"
import {
  formatDate,
  formatDateDistance,
  formatWeek,
  formatWeekDistance,
  isValidDateString,
  isValidWeekString,
} from "../utils/date"
import { updateFrontmatterValue } from "../utils/frontmatter"
import { clearNoteDraft, getNoteDraft, setNoteDraft } from "../utils/note-draft"
import { parseNote } from "../utils/parse-note"
import { pluralize } from "../utils/pluralize"
import { notificationSound, playSound } from "../utils/sounds"

type RouteSearch = {
  mode: "read" | "write"
  query: string | undefined
  view: "grid" | "list"
  content?: string
}

export const Route = createFileRoute("/_appRoot/notes_/$")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      mode: search.mode === "write" ? "write" : "read",
      query: typeof search.query === "string" ? search.query : undefined,
      view: search.view === "list" ? "list" : "grid",
      content: typeof search.content === "string" ? search.content : undefined,
    }
  },
  component: RouteComponent,
})

const isRepoClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned"),
)

function PageTitle({ note }: { note: Note }) {
  if (note.type === "daily" || note.type === "weekly") {
    return (
      <span className="font-content">
        <span>{note.displayName}</span>
        <span className="mx-2 font-normal text-text-secondary">·</span>
        <span className="font-normal text-text-secondary">
          {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
        </span>
      </span>
    )
  }

  return <span className="font-content">{note.displayName}</span>
}

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)

  if (isSignedOut || isRepoCloned) {
    return <NotePage key={noteId} />
  }

  return (
    <AppLayout title={`${noteId}.md`} icon={<NoteIcon16 />}>
      <div>{/* TODO */}</div>
    </AppLayout>
  )
}

const toggleModeShortcut = ["⌘", "E"]

function renderTemplate(template: Template, args: Record<string, unknown> = {}) {
  let text = ejs.render(template.body, args)
  text = removeFrontmatterComments(text)
  text = text.replace("{cursor}", "")
  return text
}

const fontDisplayNames: Record<Font, string> = {
  sans: "Sans serif",
  serif: "Serif",
  handwriting: "Handwriting",
}

function NotePage() {
  // Router
  const { _splat: noteId } = Route.useParams()
  const { mode, query, view, content: defaultContent } = Route.useSearch()
  const navigate = Route.useNavigate()

  // Global state
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const dailyTemplate = useAtomValue(dailyTemplateAtom)
  const weeklyTemplate = useAtomValue(weeklyTemplateAtom)
  // removed global width atom; width is per-note via frontmatter
  const defaultFont = useAtomValue(defaultFontAtom)
  const { online } = useNetworkState()

  // Note data
  const note = useNoteById(noteId)
  const searchNotes = useSearchNotes()
  const backlinks = React.useMemo(
    () => searchNotes(`link:"${noteId}" -id:"${noteId}"`),
    [noteId, searchNotes],
  )
  const isDailyNote = isValidDateString(noteId ?? "")
  const isWeeklyNote = isValidWeekString(noteId ?? "")

  // Editor state
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)
  const { editorValue, setEditorValue, isDraft, discardChanges } = useEditorValue({
    noteId: noteId ?? "",
    note,
    defaultValue: defaultContent
      ? defaultContent
      : isDailyNote && dailyTemplate
        ? renderTemplate(dailyTemplate, { date: noteId ?? "" })
        : isWeeklyNote && weeklyTemplate
          ? renderTemplate(weeklyTemplate, { week: noteId ?? "" })
          : "",
  })
  const [editorSettings] = useEditorSettings()
  const parsedNote = React.useMemo(
    () => parseNote(noteId ?? "", editorValue),
    [noteId, editorValue],
  )
  const [isDraggingFile, setIsDraggingFile] = React.useState(false)

  // Resolve font (frontmatter font or default)
  const frontmatterFont = parsedNote?.frontmatter?.font
  const parseResult = fontSchema.safeParse(frontmatterFont)
  const parsedFont = parseResult.success ? parseResult.data : null
  const resolvedFont = parsedFont || defaultFont

  // Resolve width (frontmatter width or default)
  const frontmatterWidth = parsedNote?.frontmatter?.width
  const parsedWidthResult = widthSchema.safeParse(frontmatterWidth)
  const resolvedWidth = parsedWidthResult.success ? parsedWidthResult.data : "fixed"

  // Set the font
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-family-content",
      `var(--font-family-${resolvedFont})`,
    )
    document.documentElement.style.setProperty(
      "--font-family-mono",
      `var(--font-family-${resolvedFont}-mono)`,
    )
  }, [resolvedFont])

  // Layout
  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false)

  // Actions
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const attachFile = useAttachFile()

  const handleSave = React.useCallback(
    (value: string) => {
      if (isSignedOut || !noteId) return

      // New notes shouldn't be saved if the editor is empty
      if (!note && !value) return

      // Only save if the content has changed
      if (value !== note?.content) {
        saveNote({ id: noteId, content: value })
      }

      clearNoteDraft({ githubRepo, noteId })
    },
    [isSignedOut, noteId, note, saveNote, githubRepo],
  )

  const updateFont = React.useCallback(
    (font: Font | null) => {
      if (!noteId) return

      const newContent = updateFrontmatterValue({
        content: editorValue,
        properties: { font },
      })

      setEditorValue(newContent)
      handleSave(newContent)
    },
    [noteId, editorValue, setEditorValue, handleSave],
  )

  const updateWidth = React.useCallback(
    (width: Width) => {
      if (!noteId) return

      const newContent = updateFrontmatterValue({
        content: editorValue,
        // "fixed" is the default width
        properties: { width: width === "fixed" ? null : width },
      })

      setEditorValue(newContent)
      handleSave(newContent)
    },
    [noteId, editorValue, setEditorValue, handleSave],
  )

  const switchToWriting = React.useCallback(() => {
    navigate({ search: (prev) => ({ ...prev, mode: "write" }), replace: true })
    setTimeout(() => {
      editorRef.current?.view?.focus()
    })
  }, [navigate])

  const switchToReading = React.useCallback(() => {
    navigate({ search: (prev) => ({ ...prev, mode: "read" }), replace: true })
  }, [navigate])

  const toggleMode = React.useCallback(() => {
    if (mode === "read") {
      switchToWriting()
    } else {
      switchToReading()
    }
  }, [mode, switchToWriting, switchToReading])

  // Value refs
  // These refs allow us to access the latest values of these variables inside callbacks and effects
  // without having to include them in dependency arrays, which could cause unnecessary re-renders.
  const noteRef = useValueRef(note)
  const githubRepoRef = useValueRef(githubRepo)
  const handleSaveRef = useValueRef(handleSave)
  const deleteNoteRef = useValueRef(deleteNote)
  const editorValueRef = useValueRef(editorValue)
  const setEditorValueRef = useValueRef(setEditorValue)
  const switchToReadingRef = useValueRef(switchToReading)
  const switchToWritingRef = useValueRef(switchToWriting)
  const isDraftRef = useValueRef(isDraft)

  // Voice conversation tools
  const sendVoiceConversation = useSetAtom(voiceConversationMachineAtom)
  React.useEffect(() => {
    const tools = [
      {
        name: "read_current_note",
        description: "Read the content of the current note.",
        parameters: z.object({}),
        execute: async () => {
          return JSON.stringify({
            note_id: noteId,
            content: editorValueRef.current,
          })
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "edit_current_note",
        description:
          "Replace the entire content of the current note with the provided text. This overwrites all existing content.",
        parameters: z.object({
          content: z.string(),
        }),
        execute: async ({ content }) => {
          setEditorValueRef.current(content)
          playSound(notificationSound)
          return JSON.stringify({ success: true })
        },
      } satisfies Tool<{ content: string }>,
      {
        name: "save_current_note",
        description: "Save the current note.",
        parameters: z.object({}),
        execute: async () => {
          handleSaveRef.current(editorValueRef.current)
          playSound(notificationSound)
          return JSON.stringify({ success: true })
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "delete_current_note",
        description: "Delete the current note. This action is irreversible.",
        parameters: z.object({}),
        execute: async () => {
          if (!noteId) return

          // Ask the user to confirm before deleting a note
          if (!window.confirm("Are you sure you want to delete this note?")) {
            return JSON.stringify({ error: "Operation cancelled by user" })
          }

          clearNoteDraft({ githubRepo: githubRepoRef.current, noteId })

          if (noteRef.current) {
            deleteNoteRef.current(noteRef.current.id)
          }

          playSound(notificationSound)

          // Go home
          await navigate({
            to: "/",
            search: { query: undefined, view: "grid" },
            replace: true,
          })

          return JSON.stringify({ success: true })
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "show_preview",
        description:
          "Switch the view to show the rendered markdown preview of the current note. This only affects how the note is displayed.",
        parameters: z.object({}),
        execute: async () => {
          switchToReadingRef.current()

          return JSON.stringify({ success: true })
        },
      } satisfies Tool<Record<string, never>>,
      {
        name: "show_source",
        description:
          "Switch the view to show the raw markdown source of the current note. This only affects how the note is displayed.",
        parameters: z.object({}),
        execute: async () => {
          switchToWritingRef.current()

          return JSON.stringify({ success: true })
        },
      } satisfies Tool<Record<string, never>>,
    ]

    sendVoiceConversation({ type: "ADD_TOOLS", tools })

    return () => {
      sendVoiceConversation({
        type: "REMOVE_TOOLS",
        toolNames: tools.map((tool) => tool.name),
      })
    }
  }, [
    deleteNoteRef,
    editorValueRef,
    githubRepoRef,
    handleSaveRef,
    noteRef,
    setEditorValueRef,
    switchToReadingRef,
    switchToWritingRef,
    navigate,
    noteId,
    sendVoiceConversation,
  ])

  // Keyboard shortcuts
  useHotkeys(
    "mod+e",
    (event) => {
      toggleMode()
      event.preventDefault()
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  useHotkeys(
    "i",
    (event) => {
      switchToWriting()
      event.preventDefault()
    },
    {
      enabled: editorSettings.vimMode && mode === "read",
    },
  )

  useHotkeys(
    "mod+s",
    (event) => {
      handleSave(editorValue)
      event.preventDefault()
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  useHotkeys(
    "mod+enter",
    (event) => {
      handleSave(editorValue)
      switchToReading()
      event.preventDefault()
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    },
  )

  // Vim commands

  useEffect(() => {
    // :w - Save
    Vim.defineEx("w", "w", () => {
      handleSaveRef.current(editorValueRef.current)
    })

    // :x - Save and switch to read mode
    Vim.defineEx("x", "x", () => {
      handleSaveRef.current(editorValueRef.current)
      switchToReadingRef.current()
    })

    // :wq - Save and switch to read mode
    Vim.defineEx("wq", "wq", () => {
      handleSaveRef.current(editorValueRef.current)
      switchToReadingRef.current()
    })

    // :q - Switch to read mode if there are no changes
    Vim.defineEx("q", "q", () => {
      if (!isDraftRef.current) {
        switchToReadingRef.current()
      }
    })
  }, [handleSaveRef, editorValueRef, switchToReadingRef, isDraftRef])

  const { isScrolled, topSentinelProps } = useIsScrolled()

  const shouldShowPageTitle =
    (!parsedNote.title && parsedNote.displayName === noteId) ||
    isScrolled ||
    isDailyNote ||
    isWeeklyNote

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {shouldShowPageTitle ? (
            <span className={cx("truncate", !note ? "font-normal italic text-text-secondary" : "")}>
              <PageTitle note={parsedNote} />
            </span>
          ) : null}
          {isDraft ? <DraftIndicator /> : null}
        </span>
      }
      icon={shouldShowPageTitle ? <NoteFavicon note={parsedNote} /> : null}
      actions={
        <div className="flex items-center gap-2">
          {(!note && editorValue) || isDraft ? (
            <Button
              disabled={isSignedOut}
              variant="primary"
              size="small"
              shortcut={["⌘", "S"]}
              onClick={() => handleSave(editorValue)}
              className="hidden sm:flex"
            >
              Save
            </Button>
          ) : null}

          <SegmentedControl aria-label="Mode" size="small" className="hidden sm:flex">
            <Tooltip open={mode === "read" ? false : undefined}>
              <Tooltip.Trigger asChild>
                <SegmentedControl.Segment selected={mode === "read"} onClick={switchToReading}>
                  Read
                </SegmentedControl.Segment>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="text-text-secondary">
                {toggleModeShortcut}
              </Tooltip.Content>
            </Tooltip>
            <Tooltip open={mode === "write" ? false : undefined}>
              <Tooltip.Trigger asChild>
                <SegmentedControl.Segment selected={mode === "write"} onClick={switchToWriting}>
                  Write
                </SegmentedControl.Segment>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="text-text-secondary">
                {toggleModeShortcut}
              </Tooltip.Content>
            </Tooltip>
          </SegmentedControl>
          <div className="flex items-center">
            <IconButton
              aria-label="Attach file"
              size="small"
              onClick={() => {
                const input = document.createElement("input")
                input.type = "file"
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    attachFile(file, editorRef.current?.view)
                  }
                }
                input.click()
              }}
            >
              <PaperclipIcon16 />
            </IconButton>
            <IconButton
              aria-label={parsedNote?.pinned ? "Unpin" : "Pin"}
              size="small"
              onClick={() => {
                const newContent = updateFrontmatterValue({
                  content: editorValue,
                  properties: { pinned: parsedNote?.pinned ? null : true },
                })
                setEditorValue(newContent)
                handleSave(newContent)
              }}
            >
              {parsedNote?.pinned ? <PinFillIcon16 className="text-text-pinned" /> : <PinIcon16 />}
            </IconButton>
            <DropdownMenu modal={false}>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="More actions" size="small" disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" side="top">
                {isDraft ? (
                  <>
                    <DropdownMenu.Item
                      icon={<UndoIcon16 />}
                      onSelect={() => {
                        discardChanges()
                        editorRef.current?.view?.focus()
                      }}
                    >
                      Discard changes
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                ) : null}

                <DropdownMenu.Item
                  className={`font-${defaultFont}`}
                  icon={<span className={`font-${defaultFont}`}>Aa</span>}
                  selected={parsedFont === null}
                  onSelect={() => updateFont(null)}
                >
                  Default{" "}
                  <span className="italic text-text-secondary">
                    ({fontDisplayNames[defaultFont]})
                  </span>
                </DropdownMenu.Item>
                {Object.entries(fontDisplayNames).map(([fontKey, displayName]) => (
                  <DropdownMenu.Item
                    key={fontKey}
                    className={`font-${fontKey}`}
                    icon={<span className={`font-${fontKey}`}>Aa</span>}
                    selected={parsedFont === fontKey}
                    onSelect={() => updateFont(fontKey as Font)}
                  >
                    {displayName}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator />
                {containerWidth > 800 && (
                  <>
                    <DropdownMenu.Item
                      icon={<CenteredIcon16 />}
                      selected={resolvedWidth === "fixed"}
                      onSelect={() => {
                        updateWidth("fixed")
                        editorRef.current?.view?.focus()
                      }}
                    >
                      Centered content
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      icon={<FullwidthIcon16 />}
                      selected={resolvedWidth === "fill"}
                      onSelect={() => {
                        updateWidth("fill")
                        editorRef.current?.view?.focus()
                      }}
                    >
                      Fullwidth content
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                )}
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(editorValue)}>
                  Copy markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(noteId ?? "")}>
                  Copy ID
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  disabled={isSignedOut || !note || !online}
                  onSelect={() => setIsShareDialogOpen(true)}
                >
                  Share
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${noteId}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isSignedOut || !note}
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item icon={<PrinterIcon16 />} onSelect={() => window.print()}>
                  Print
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  variant="danger"
                  icon={<TrashIcon16 />}
                  disabled={isSignedOut}
                  onSelect={() => {
                    if (!noteId) return

                    // Ask the user to confirm before deleting a note with backlinks
                    if (
                      note &&
                      note.backlinks.length > 0 &&
                      !window.confirm(
                        `${note.id}.md has ${pluralize(
                          note.backlinks.length,
                          "backlink",
                        )}. Are you sure you want to delete it?`,
                      )
                    ) {
                      return
                    }

                    clearNoteDraft({ githubRepo, noteId })

                    if (note) {
                      deleteNote(note.id)
                    }

                    // Go home
                    navigate({
                      to: "/",
                      search: { query: undefined, view: "grid" },
                      replace: true,
                    })
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
            <ShareDialog
              note={parsedNote}
              onPublish={(gistId) => {
                const newContent = updateFrontmatterValue({
                  content: editorValue,
                  properties: { gist_id: gistId },
                })
                setEditorValue(newContent)
                handleSave(newContent)
              }}
              onUnpublish={() => {
                const newContent = updateFrontmatterValue({
                  content: editorValue,
                  properties: { gist_id: null },
                })
                setEditorValue(newContent)
                handleSave(newContent)
                setIsShareDialogOpen(false)
              }}
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
            />
          </div>
        </div>
      }
      floatingActions={
        <div className="card-2 flex gap-1.5 coarse:gap-2 !rounded-full p-1.5 coarse:p-2 sm:hidden print:hidden">
          {(!note && editorValue) || isDraft ? (
            <Button
              disabled={isSignedOut}
              variant="primary"
              shortcut={["⌘", "S"]}
              onClick={() => handleSave(editorValue)}
              className="coarse:h-12 rounded-full coarse:px-6"
            >
              Save
            </Button>
          ) : null}
          <RadixSwitch.Root
            checked={mode === "write"}
            onCheckedChange={(checked) => {
              if (checked) {
                switchToWriting()
              } else {
                switchToReading()
              }
            }}
            className={cx(
              "relative h-8 coarse:h-12 w-[48px] coarse:w-[72px] cursor-pointer rounded-full bg-bg-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-inset data-[state=unchecked]:ring-border-secondary data-[state=unchecked]:hover:bg-bg-secondary-hover",
            )}
          >
            <RadixSwitch.Thumb className="pointer-events-none grid size-8 coarse:size-12 translate-x-0 place-items-center rounded-full border border-border bg-bg-overlay text-text-secondary transition-transform will-change-transform data-[state=checked]:translate-x-[16px] coarse:data-[state=checked]:translate-x-[24px] data-[state=checked]:border-border-focus">
              <EditIcon16 />
            </RadixSwitch.Thumb>
          </RadixSwitch.Root>
        </div>
      }
    >
      <InsertTemplateDialog />
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={containerRef}
        onMouseDown={(event) => {
          // Double click to edit
          if (mode === "read" && event.detail > 1) {
            event.preventDefault()
            switchToWriting()
          }
        }}
      >
        <div {...topSentinelProps} />
        <div className="p-4 lg:p-8">
          <div
            className={cx(
              "flex flex-col gap-8 pb-[50vh]",
              resolvedWidth === "fixed" && "mx-auto max-w-3xl",
            )}
          >
            {isDailyNote || isWeeklyNote ? (
              <Calendar className="print:hidden" activeNoteId={noteId ?? ""} />
            ) : null}

            {mode === "read" && (
              <div>
                {parsedNote?.frontmatter?.gist_id ? (
                  <div className="mb-5 print:hidden">
                    <PillButton
                      className="pl-1 coarse:pl-2"
                      onClick={() => setIsShareDialogOpen(true)}
                    >
                      <GlobeIcon16 className="text-border-focus" />
                      Published
                    </PillButton>
                  </div>
                ) : null}
                {
                  // When printing a daily or weekly note without a title,
                  // insert the date or week number as the title
                  (isDailyNote || isWeeklyNote) && !note?.title ? (
                    <h1 className="mb-4 hidden font-content text-xl font-bold leading-[1.4] print:block">
                      {isDailyNote
                        ? formatDate(noteId ?? "", { alwaysIncludeYear: true })
                        : formatWeek(noteId ?? "")}
                    </h1>
                  ) : null
                }
                <Markdown onChange={setEditorValue}>{editorValue}</Markdown>
              </div>
            )}
            <div
              hidden={mode !== "write"}
              className={cx(
                isDraggingFile &&
                  "rounded-sm outline-dashed outline-2 outline-offset-8 outline-border",
              )}
              onDragOver={(event) => {
                // Show visual feedback when dragging files
                if (event.dataTransfer.types.includes("Files")) {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = "copy"
                  setIsDraggingFile(true)
                }
              }}
              onDragLeave={() => {
                setIsDraggingFile(false)
              }}
              onDrop={(event) => {
                // Handle dropped files
                if (event.dataTransfer.files.length > 0) {
                  event.preventDefault()
                  const file = event.dataTransfer.files[0]
                  attachFile(file, editorRef.current?.view)
                }
                setIsDraggingFile(false)
              }}
            >
              <NoteEditor
                ref={editorRef}
                defaultValue={editorValue}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={setEditorValue}
                minHeight={160}
              />
            </div>
            {isWeeklyNote ? (
              <Details className="print:hidden">
                <Details.Summary>Days</Details.Summary>
                <DaysOfWeek week={noteId ?? ""} />
              </Details>
            ) : null}
            {backlinks.length > 0 ? (
              <Details className="print:hidden">
                <Details.Summary>Backlinks</Details.Summary>
                <LinkHighlightProvider href={`/notes/${noteId}`}>
                  <NoteList
                    baseQuery={`link:"${noteId}" -id:"${noteId}"`}
                    query={query ?? ""}
                    view={view}
                    onQueryChange={(query) =>
                      navigate({
                        search: (prev) => ({ ...prev, query }),
                        replace: true,
                      })
                    }
                    onViewChange={(view) =>
                      navigate({
                        search: (prev) => ({ ...prev, view }),
                        replace: true,
                      })
                    }
                  />
                </LinkHighlightProvider>
              </Details>
            ) : null}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function useEditorValue({
  noteId,
  note,
  defaultValue,
}: {
  noteId: NoteId
  note: Note | undefined
  defaultValue: string
}) {
  const githubRepo = useAtomValue(githubRepoAtom)

  const [editorValue, _setEditorValue] = useState(() => {
    return getNoteDraft({ githubRepo, noteId }) ?? note?.content ?? defaultValue
  })

  const isDraft = useMemo(() => {
    return editorValue !== (note ? note.content : defaultValue)
  }, [note, editorValue, defaultValue])

  const setEditorValue = useCallback(
    (value: string) => {
      _setEditorValue(value)

      if (note ? value !== note.content : value !== defaultValue) {
        setNoteDraft({ githubRepo, noteId, value })
      } else {
        clearNoteDraft({ githubRepo, noteId })
      }
    },
    [note, defaultValue, githubRepo, noteId],
  )

  const discardChanges = useCallback(() => {
    // Reset editor value to the last saved state of the note
    _setEditorValue(note?.content ?? defaultValue)
    clearNoteDraft({ githubRepo, noteId })
  }, [note, defaultValue, githubRepo, noteId])

  return { editorValue, setEditorValue, isDraft, discardChanges }
}
