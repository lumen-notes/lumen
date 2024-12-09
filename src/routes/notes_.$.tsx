import { createFileRoute } from "@tanstack/react-router"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import useResizeObserver from "use-resize-observer"
import { AppLayout } from "../components/app-layout"
import { Button } from "../components/button"
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
  PinFillIcon12,
  PinFillIcon16,
  PinIcon16,
  ShareIcon16,
  TrashIcon16,
  UndoIcon16,
} from "../components/icons"
import { Markdown } from "../components/markdown"
import { NoteEditor } from "../components/note-editor"
import { SegmentedControl } from "../components/segmented-control"
import {
  githubRepoAtom,
  githubUserAtom,
  globalStateMachineAtom,
  isSignedOutAtom,
} from "../global-state"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { GitHubRepository, Note, NoteId } from "../schema"
import { cx } from "../utils/cx"
import { exportAsGist } from "../utils/export-as-gist"
import { checkIfPinned, togglePin } from "../utils/pin"
import { pluralize } from "../utils/pluralize"
import { Vim } from "@replit/codemirror-vim"
import { useEditorSettings } from "../hooks/editor-settings"
import { useSearchNotes } from "../hooks/search"
import { Details } from "../components/details"
import { LinkHighlightProvider } from "../components/link-highlight-provider"
import { NoteList } from "../components/note-list"

type RouteSearch = {
  mode: "read" | "write"
  width: "fixed" | "fill"
}

export const Route = createFileRoute("/notes_/$")({
  validateSearch: (search: Record<string, unknown>): RouteSearch => {
    return {
      mode: search.mode === "write" ? "write" : "read",
      width: search.width === "fill" ? "fill" : "fixed",
    }
  },
  component: RouteComponent,
})

const isRepoClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned"),
)

function RouteComponent() {
  const { _splat: noteId } = Route.useParams()
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const isRepoCloned = useAtomValue(isRepoClonedAtom)

  if (isSignedOut || isRepoCloned) {
    return <NotePage key={noteId} />
  }

  return (
    <AppLayout title={`${noteId}.md`}>
      <div>{/* TODO */}</div>
    </AppLayout>
  )
}

const toggleModeShortcut = ["⌥", "⇥"]

function useGetter<T>(value: T) {
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])
  return useCallback(() => valueRef.current, [])
}

function NotePage() {
  const { _splat: noteId } = Route.useParams()
  const { mode, width } = Route.useSearch()
  const navigate = Route.useNavigate()
  const note = useNoteById(noteId)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const isSignedOut = useAtomValue(isSignedOutAtom)
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const defaultEditorValue = ""
  const { ref: containerRef, width: containerWidth = 0 } = useResizeObserver()
  const [editorSettings] = useEditorSettings()
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const { editorValue, setEditorValue, isDirty, discardChanges, clearDraft } = useEditorValue({
    noteId: noteId ?? "",
    note,
    defaultValue: defaultEditorValue,
  })
  const isPinned = useMemo(() => checkIfPinned(editorValue), [editorValue])
  const searchNotes = useSearchNotes()
  const backlinks = useMemo(
    () => searchNotes(`link:"${noteId}" -id:"${noteId}"`),
    [noteId, searchNotes],
  )

  const handleSave = useCallback(
    (value: string) => {
      if (isSignedOut || !noteId) return

      // Only save if the content has changed
      if (value !== note?.content) {
        saveNote({ id: noteId, content: value })
      }

      clearDraft()
    },
    [isSignedOut, noteId, note, saveNote, clearDraft],
  )

  const switchToWriting = useCallback(() => {
    navigate({ search: { mode: "write", width }, replace: true })
    setTimeout(() => {
      editorRef.current?.view?.focus()
    })
  }, [navigate, width])

  const switchToReading = useCallback(() => {
    navigate({ search: { mode: "read", width }, replace: true })
  }, [navigate, width])

  const toggleMode = useCallback(() => {
    if (mode === "read") {
      switchToWriting()
    } else {
      switchToReading()
    }
  }, [mode, switchToWriting, switchToReading])

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

  // Configure Vim mode
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

  return (
    <AppLayout
      title={
        <span className="flex items-center gap-2">
          {isPinned ? <PinFillIcon12 className="text-[var(--orange-11)]" /> : null}
          <span className={cx("truncate", !note ? "italic text-text-secondary" : "")}>
            {Array.from({ length: 200 })
              .map((_, i) => i)
              .join("")}
          </span>
          {isDirty ? <DotIcon8 className="text-[var(--yellow-11)]" /> : null}
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          {!note || isDirty ? (
            <Button size="small" shortcut={["⌘", "S"]} onClick={() => handleSave(editorValue)}>
              {!note ? "Create" : "Save"}
            </Button>
          ) : null}
          <SegmentedControl aria-label="Mode" size="small" className="hidden md:flex">
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
          <IconButton
            aria-label={mode === "read" ? "Write mode" : "Read mode"}
            size="small"
            shortcut={toggleModeShortcut}
            className="md:hidden"
            onClick={toggleMode}
          >
            {mode === "read" ? <EditIcon16 /> : <EyeIcon16 />}
          </IconButton>
          <div className="flex items-center">
            {/* {containerWidth > 800 && (
              <IconButton
                aria-label="Toggle width"
                size="small"
                onClick={() =>
                  navigate({
                    search: { width: width === "fixed" ? "fill" : "fixed", mode },
                    replace: true,
                  })
                }
              >
                {width === "fixed" ? <CenteredIcon16 /> : <FullwidthIcon16 />}
              </IconButton>
            )} */}
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
                    isPinned ? <PinFillIcon16 className="text-[var(--orange-11)]" /> : <PinIcon16 />
                  }
                  disabled={isSignedOut}
                  onSelect={() => {
                    setEditorValue(togglePin(editorValue))
                  }}
                >
                  {isPinned ? "Unpin" : "Pin"}
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                {containerWidth > 800 && (
                  <>
                    <DropdownMenu.Item
                      icon={<CenteredIcon16 />}
                      selected={width === "fixed"}
                      onSelect={() => {
                        navigate({
                          search: { width: "fixed", mode },
                          replace: true,
                        })
                      }}
                    >
                      Centered content
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      icon={<FullwidthIcon16 />}
                      selected={width === "fill"}
                      onSelect={() => {
                        navigate({ search: { width: "fill", mode }, replace: true })
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
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${noteId}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={isSignedOut}
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  disabled={isSignedOut}
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

                    deleteNote(noteId)
                    navigate({ to: "/", replace: true })
                  }}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>
      }
    >
      <div ref={containerRef}>
        <div className="p-4">
          <div
            className={cx(
              "flex flex-col gap-8 pb-[50vh]",
              width === "fixed" && "mx-auto max-w-3xl",
            )}
          >
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
            <div
              hidden={mode !== "read"}
              onMouseDown={(event) => {
                // Double click to edit
                if (event.detail > 1) {
                  event.preventDefault()
                  switchToWriting()
                }
              }}
            >
              {editorValue ? (
                <Markdown onChange={setEditorValue}>{editorValue}</Markdown>
              ) : (
                <span className="italic text-text-secondary">Empty note</span>
              )}
            </div>
            <div hidden={mode !== "write"}>
              <NoteEditor
                ref={editorRef}
                defaultValue={editorValue}
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onChange={setEditorValue}
              />
            </div>
            {backlinks.length > 0 ? (
              <Details>
                <Details.Summary>Backlinks</Details.Summary>
                <LinkHighlightProvider href={`/${noteId}`}>
                  <NoteList baseQuery={`link:"${noteId}" -id:"${noteId}"`} />
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
