import * as RadixSwitch from "@radix-ui/react-switch"
import { Vim } from "@replit/codemirror-vim"
import { createFileRoute } from "@tanstack/react-router"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import ejs from "ejs"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
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
  DotIcon8,
  EditIcon16,
  ExternalLinkIcon16,
  FullwidthIcon16,
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
import { InsertTemplateDialog, removeFrontmatterComments } from "../components/insert-template"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { NoteFavicon } from "../components/note-favicon"
import { NoteList } from "../components/note-list"
import { SegmentedControl } from "../components/segmented-control"
import { Tool, voiceConversationMachineAtom } from "../components/voice-conversation"
import {
  dailyTemplateAtom,
  fontAtom,
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  isSignedOutAtom,
  weeklyTemplateAtom,
  widthAtom,
} from "../global-state"
import { useAttachFile } from "../hooks/attach-file"
import { useEditorSettings } from "../hooks/editor-settings"
import { useValueRef } from "../hooks/value-ref"
import { useIsScrolled } from "../hooks/is-scrolled"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { GitHubRepository, Note, NoteId, Template } from "../schema"
import { cx } from "../utils/cx"
import {
  formatDate,
  formatDateDistance,
  formatWeek,
  formatWeekDistance,
  isValidDateString,
  isValidWeekString,
} from "../utils/date"
import { exportAsGist } from "../utils/export-as-gist"
import { parseNote } from "../utils/parse-note"
import { togglePin } from "../utils/pin"
import { pluralize } from "../utils/pluralize"

type RouteSearch = {
  mode: "read" | "write"
  query: string | undefined
  view: "grid" | "list"
}

export const Route = createFileRoute("/notes_/$")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      mode: search.mode === "write" ? "write" : "read",
      query: typeof search.query === "string" ? search.query : undefined,
      view: search.view === "list" ? "list" : "grid",
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
      <span>
        <span>{note.displayName}</span>
        <span className="mx-2 font-normal text-text-secondary">·</span>
        <span className="font-normal text-text-secondary">
          {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
        </span>
      </span>
    )
  }

  return note.displayName
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

const toggleModeShortcut = ["⌥", "⇥"]

function renderTemplate(template: Template, args: Record<string, unknown> = {}) {
  let text = ejs.render(template.body, args)
  text = removeFrontmatterComments(text)
  text = text.replace("{cursor}", "")
  return text
}

function NotePage() {
  // Router
  const { _splat: noteId } = Route.useParams()
  const { mode, query, view } = Route.useSearch()
  const navigate = Route.useNavigate()

  // Global state
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const dailyTemplate = useAtomValue(dailyTemplateAtom)
  const weeklyTemplate = useAtomValue(weeklyTemplateAtom)
  const [width, setWidth] = useAtom(widthAtom)
  const [font, setFont] = useAtom(fontAtom)

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
  const { editorValue, setEditorValue, isDirty, discardChanges, clearDraft } = useEditorValue({
    noteId: noteId ?? "",
    note,
    defaultValue:
      isDailyNote && dailyTemplate
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

  // Layout
  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()

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

      clearDraft()
    },
    [isSignedOut, noteId, note, saveNote, clearDraft],
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
  const isDirtyRef = useValueRef(isDirty)

  // Voice conversation tools
  const sendVoiceConversation = useSetAtom(voiceConversationMachineAtom)
  React.useEffect(() => {
    const tools = [
      {
        name: "read_current_note",
        description: "Read the content of the current note",
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
        description: "Edit the content of the current note",
        parameters: z.object({
          content: z.string(),
        }),
        execute: async ({ content }) => {
          setEditorValueRef.current(content)

          return JSON.stringify({ success: true })
        },
      } satisfies Tool<{ content: string }>,
      {
        name: "save_current_note",
        description: "Save the current note.",
        parameters: z.object({}),
        execute: async () => {
          handleSaveRef.current(editorValueRef.current)

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

          localStorage.removeItem(getNoteStorageKey({ githubRepo: githubRepoRef.current, noteId }))

          if (noteRef.current) {
            deleteNoteRef.current(noteRef.current.id)
          }

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
      sendVoiceConversation({ type: "REMOVE_TOOLS", toolNames: tools.map((tool) => tool.name) })
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
    "alt+tab",
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
      if (!isDirtyRef.current) {
        switchToReadingRef.current()
      }
    })
  }, [handleSaveRef, editorValueRef, switchToReadingRef, isDirtyRef])

  const { isScrolled, topSentinelProps } = useIsScrolled()

  const shouldShowPageTitle = isScrolled || isDailyNote || isWeeklyNote

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {shouldShowPageTitle ? (
            <span className={cx("truncate", !note ? "font-normal italic text-text-secondary" : "")}>
              <PageTitle note={parsedNote} />
            </span>
          ) : null}
          {isDirty ? <DotIcon8 className="text-text-pending" /> : null}
        </span>
      }
      icon={shouldShowPageTitle ? <NoteFavicon note={parsedNote} /> : null}
      actions={
        <div className="flex items-center gap-2">
          {(!note && editorValue) || isDirty ? (
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
            <SegmentedControl.Segment
              selected={mode === "read"}
              shortcut={mode !== "read" ? toggleModeShortcut : undefined}
              onClick={switchToReading}
            >
              Read
            </SegmentedControl.Segment>
            <SegmentedControl.Segment
              selected={mode === "write"}
              shortcut={mode !== "write" ? toggleModeShortcut : undefined}
              onClick={switchToWriting}
            >
              Write
            </SegmentedControl.Segment>
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
              onClick={() => {
                setEditorValue(togglePin(editorValue))
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
                {isDirty ? (
                  <>
                    <DropdownMenu.Item icon={<UndoIcon16 />} onSelect={discardChanges}>
                      Discard changes
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                ) : null}
                {containerWidth > 800 && (
                  <>
                    <DropdownMenu.Item
                      icon={<CenteredIcon16 />}
                      selected={width === "fixed"}
                      onSelect={() => {
                        setWidth("fixed")
                        editorRef.current?.view?.focus()
                      }}
                    >
                      Centered content
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      icon={<FullwidthIcon16 />}
                      selected={width === "fill"}
                      onSelect={() => {
                        setWidth("fill")
                        editorRef.current?.view?.focus()
                      }}
                    >
                      Fullwidth content
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                )}
                <DropdownMenu.Item
                  className="font-sans"
                  icon={<span className="font-sans">Aa</span>}
                  selected={font === "sans"}
                  onSelect={() => setFont("sans")}
                >
                  Simple
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="font-serif"
                  icon={<span className="font-serif">Aa</span>}
                  selected={font === "serif"}
                  onSelect={() => setFont("serif")}
                >
                  Bookish
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="font-handwriting"
                  icon={<span className="font-handwriting">Aa</span>}
                  selected={font === "handwriting"}
                  onSelect={() => setFont("handwriting")}
                >
                  Scribbled
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(editorValue)}>
                  Copy markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item icon={<CopyIcon16 />} onSelect={() => copy(noteId ?? "")}>
                  Copy ID
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${noteId}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isSignedOut || !note}
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  disabled={isSignedOut || !note}
                  onSelect={async () => {
                    if (!note) return

                    const url = await exportAsGist({
                      githubToken: githubUser?.token ?? "",
                      noteId: note.id,
                      note,
                    })

                    // Copy Gist URL to clipboard
                    copy(url)

                    // Open Gist in new tab
                    window.open(url, "_blank")
                  }}
                >
                  Export as Gist
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

                    localStorage.removeItem(getNoteStorageKey({ githubRepo, noteId }))

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
          </div>
        </div>
      }
      floatingActions={
        <div className="card-2 flex gap-2 !rounded-full p-2 sm:hidden print:hidden">
          {(!note && editorValue) || isDirty ? (
            <Button
              disabled={isSignedOut}
              variant="primary"
              shortcut={["⌘", "S"]}
              onClick={() => handleSave(editorValue)}
              className="!h-12 rounded-full !px-6"
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
              "relative h-12 w-[72px] cursor-pointer rounded-full bg-bg-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-border-focus data-[state=checked]:bg-border-focus data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-inset data-[state=unchecked]:ring-border-secondary data-[state=unchecked]:hover:bg-bg-tertiary",
            )}
          >
            <RadixSwitch.Thumb className="pointer-events-none grid h-12 w-12 translate-x-0 place-items-center rounded-full border border-border bg-bg-overlay text-text-secondary transition-transform will-change-transform data-[state=checked]:translate-x-[24px] data-[state=checked]:border-border-focus">
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
              "flex flex-col gap-10 pb-[50vh]",
              width === "fixed" && "mx-auto max-w-3xl",
            )}
          >
            {isDailyNote || isWeeklyNote ? (
              <Calendar className="print:hidden" activeNoteId={noteId ?? ""} />
            ) : null}
            {mode === "read" && (
              <div>
                {
                  // When printing a daily or weekly note without a title,
                  // insert the date or week number as the title
                  (isDailyNote || isWeeklyNote) && !note?.title ? (
                    <h1 className="mb-4 hidden font-content text-xl font-bold leading-5 print:block">
                      {isDailyNote
                        ? formatDate(noteId ?? "", { alwaysIncludeYear: true })
                        : formatWeek(noteId ?? "")}
                    </h1>
                  ) : null
                }
                {editorValue ? (
                  <Markdown onChange={setEditorValue}>{editorValue}</Markdown>
                ) : (
                  <span className="font-content italic text-text-secondary text-[16px]">
                    Empty note
                  </span>
                )}
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
                      navigate({ search: (prev) => ({ ...prev, query }), replace: true })
                    }
                    onViewChange={(view) =>
                      navigate({ search: (prev) => ({ ...prev, view }), replace: true })
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

function getNoteStorageKey({
  githubRepo,
  noteId,
}: {
  githubRepo: GitHubRepository | null
  noteId: NoteId
}) {
  if (!githubRepo) return ""
  return `${githubRepo.owner}/${githubRepo.name}/${noteId}`
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
    // We use localStorage to persist a "draft" of the note while editing,
    // then clear it when the note is saved
    return (
      localStorage.getItem(getNoteStorageKey({ githubRepo, noteId })) ??
      note?.content ??
      defaultValue
    )
  })

  const isDirty = useMemo(() => {
    return note && editorValue !== note.content
  }, [note, editorValue])

  const setEditorValue = useCallback(
    (value: string) => {
      _setEditorValue(value)

      if (note ? value !== note.content : value !== defaultValue) {
        localStorage.setItem(getNoteStorageKey({ githubRepo, noteId }), value)
      } else {
        localStorage.removeItem(getNoteStorageKey({ githubRepo, noteId }))
      }
    },
    [note, defaultValue, githubRepo, noteId],
  )

  const discardChanges = useCallback(() => {
    // Reset editor value to the last saved state of the note
    _setEditorValue(note?.content ?? defaultValue)
    // Clear the "draft" from localStorage
    localStorage.removeItem(getNoteStorageKey({ githubRepo, noteId }))
  }, [note, defaultValue, githubRepo, noteId])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(getNoteStorageKey({ githubRepo, noteId }))
  }, [githubRepo, noteId])

  return { editorValue, setEditorValue, isDirty, discardChanges, clearDraft }
}
