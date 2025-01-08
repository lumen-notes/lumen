import { Vim } from "@replit/codemirror-vim"
import { createFileRoute } from "@tanstack/react-router"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import ejs from "ejs"
import { useAtom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import useResizeObserver from "use-resize-observer"
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
  EyeIcon16,
  FullwidthIcon16,
  MoreIcon16,
  NoteIcon16,
  PinFillIcon16,
  PinIcon16,
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
import { useEditorSettings } from "../hooks/editor-settings"
import { useGetter } from "../hooks/getter"
import { useIsScrolled } from "../hooks/is-scrolled"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { GitHubRepository, Note, NoteId, Template } from "../schema"
import { cx } from "../utils/cx"
import {
  formatDateDistance,
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
  const backlinks = useMemo(
    () => searchNotes(`link:"${noteId}" -id:"${noteId}"`),
    [noteId, searchNotes],
  )
  const isDailyNote = isValidDateString(noteId ?? "")
  const isWeeklyNote = isValidWeekString(noteId ?? "")

  // Editor state
  const editorRef = useRef<ReactCodeMirrorRef>(null)
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
  const parsedNote = useMemo(() => parseNote(noteId ?? "", editorValue), [noteId, editorValue])

  // Layout
  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()

  // Actions
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()

  const handleSave = useCallback(
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

  const switchToWriting = useCallback(() => {
    navigate({ search: (prev) => ({ ...prev, mode: "write" }), replace: true })
    setTimeout(() => {
      editorRef.current?.view?.focus()
    })
  }, [navigate])

  const switchToReading = useCallback(() => {
    navigate({ search: (prev) => ({ ...prev, mode: "read" }), replace: true })
  }, [navigate])

  const toggleMode = useCallback(() => {
    if (mode === "read") {
      switchToWriting()
    } else {
      switchToReading()
    }
  }, [mode, switchToWriting, switchToReading])

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
  const getHandleSave = useGetter(handleSave)
  const getEditorValue = useGetter(editorValue)
  const getSwitchToReading = useGetter(switchToReading)
  const getIsDirty = useGetter(isDirty)

  useEffect(() => {
    // :w - Save
    Vim.defineEx("w", "w", () => {
      const handleSave = getHandleSave()
      const editorValue = getEditorValue()
      handleSave(editorValue)
    })

    // :x - Save and switch to read mode
    Vim.defineEx("x", "x", () => {
      const handleSave = getHandleSave()
      const editorValue = getEditorValue()
      const switchToReading = getSwitchToReading()
      handleSave(editorValue)
      switchToReading()
    })

    // :wq - Save and switch to read mode
    Vim.defineEx("wq", "wq", () => {
      const handleSave = getHandleSave()
      const editorValue = getEditorValue()
      const switchToReading = getSwitchToReading()
      handleSave(editorValue)
      switchToReading()
    })

    // :q - Switch to read mode if there are no changes
    Vim.defineEx("q", "q", () => {
      const isDirty = getIsDirty()
      const switchToReading = getSwitchToReading()
      if (!isDirty) {
        switchToReading()
      }
    })
  }, [getHandleSave, getEditorValue, getSwitchToReading, getIsDirty])

  const { isScrolled, topSentinelProps } = useIsScrolled()

  const shouldShowPageTitle =
    parsedNote.displayName !== "Untitled note" && (isScrolled || !parsedNote.title)

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {/* {parsedNote.pinned ? <PinFillIcon12 className="text-[var(--orange-11)]" /> : null} */}
          {shouldShowPageTitle ? (
            <span className={cx("truncate", !note ? "font-normal italic text-text-secondary" : "")}>
              <PageTitle note={parsedNote} />
            </span>
          ) : null}
          {isDirty ? <DotIcon8 className="text-[var(--amber-11)]" /> : null}
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
                <DropdownMenu.Item
                  icon={
                    parsedNote.pinned ? (
                      <PinFillIcon16 className="text-[var(--orange-11)]" />
                    ) : (
                      <PinIcon16 />
                    )
                  }
                  onSelect={() => {
                    setEditorValue(togglePin(editorValue))
                  }}
                >
                  {parsedNote.pinned ? "Unpin" : "Pin"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
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
                {mode === "read" ? (
                  <>
                    <DropdownMenu.Item
                      icon={
                        <div className="relative size-4">
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            Aa
                          </span>
                        </div>
                      }
                      selected={font === "sans-serif"}
                      onSelect={() => setFont("sans-serif")}
                    >
                      Sans-serif
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="font-serif"
                      icon={
                        <div className="relative size-4">
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif">
                            Aa
                          </span>
                        </div>
                      }
                      selected={font === "serif"}
                      onSelect={() => setFont("serif")}
                    >
                      Serif
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                  </>
                ) : null}
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
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  variant="danger"
                  icon={<TrashIcon16 />}
                  disabled={isSignedOut || !note}
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

                    deleteNote(noteId)
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
        <div className="flex gap-2 sm:hidden">
          {(!note && editorValue) || isDirty ? (
            <div className="flex rounded-full bg-bg-backdrop backdrop-blur-md transition-transform has-[button:active]:scale-110">
              <Button
                disabled={isSignedOut}
                variant="primary"
                shortcut={["⌘", "S"]}
                onClick={() => handleSave(editorValue)}
                className="h-12 rounded-full px-5  coarse:h-14 coarse:px-6"
              >
                Save
              </Button>
            </div>
          ) : null}
          <div className="flex rounded-full bg-bg-backdrop backdrop-blur-md transition-transform has-[button:active]:scale-110">
            <IconButton
              aria-label={mode === "read" ? "Write mode" : "Read mode"}
              shortcut={toggleModeShortcut}
              tooltipSide="top"
              tooltipAlign="end"
              onClick={toggleMode}
              className="h-12 w-12 rounded-full bg-bg-tertiary hover:bg-bg-tertiary coarse:h-14 coarse:w-14"
            >
              {mode === "read" ? <EditIcon16 /> : <EyeIcon16 />}
            </IconButton>
          </div>
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
        <div className="p-4">
          <div
            className={cx(
              "flex flex-col gap-8 pb-[50vh]",
              width === "fixed" && "mx-auto max-w-3xl",
            )}
          >
            {isDailyNote || isWeeklyNote ? <Calendar activeNoteId={noteId ?? ""} /> : null}
            {mode === "read" && (
              <div>
                {editorValue ? (
                  <Markdown onChange={setEditorValue}>{editorValue}</Markdown>
                ) : (
                  <span className="italic text-text-secondary">Empty note</span>
                )}
              </div>
            )}
            <div hidden={mode !== "write"}>
              <NoteEditor
                ref={editorRef}
                defaultValue={editorValue}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={setEditorValue}
              />
            </div>
            {isWeeklyNote ? (
              <Details>
                <Details.Summary>Days</Details.Summary>
                <DaysOfWeek week={noteId ?? ""} />
              </Details>
            ) : null}
            {backlinks.length > 0 ? (
              <Details>
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
