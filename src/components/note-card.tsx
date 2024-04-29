import { EditorSelection } from "@codemirror/state"
import { Vim } from "@replit/codemirror-vim"
import { ReactCodeMirrorRef, ViewUpdate } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { flushSync } from "react-dom"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { GitHubRepository, NoteId } from "../schema"
import { getEditorSettings } from "../utils/editor-settings"
import { exportAsGist } from "../utils/export-as-gist"
import { pluralize } from "../utils/pluralize"
import { Button } from "./button"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  GlassesIcon16,
  LoadingIcon16,
  MoreIcon16,
  PinFillIcon16,
  ShareIcon16,
  TrashIcon16,
} from "./icons"
import { Link } from "./link"
import { Markdown } from "./markdown"
import { NoteEditor } from "./note-editor"
import { usePanel, usePanelActions } from "./panels"
import { cx } from "../utils/cx"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

type NoteCardProps = {
  id: NoteId
  defaultValue?: string
  elevation?: CardProps["elevation"]
  selected?: boolean
  onCancel?: () => void
}

export function NoteCard(props: NoteCardProps) {
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)

  // Show a loading state while resolving the repo
  if (isResolvingRepo) {
    return (
      <Card elevation={props.elevation} className="flex flex-col">
        <div className="flex h-12 items-center px-4">
          <span className="filepath text-text-secondary">{props.id}.md</span>
        </div>
        <div className="p-4 pt-0">
          <span className="flex items-center gap-2 text-text-secondary">
            <LoadingIcon16 />
            Loading…
          </span>
        </div>
      </Card>
    )
  }

  return <_NoteCard {...props} />
}

const _NoteCard = React.memo(function NoteCard({
  id,
  defaultValue = "",
  elevation,
  selected = false,
  onCancel,
}: NoteCardProps) {
  const note = useNoteById(id)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const { vimMode } = getEditorSettings()

  // Refs
  const cardRef = React.useRef<HTMLDivElement>(null)
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)

  // Panel context
  const { closePanel } = usePanelActions()
  const panel = usePanel()

  // Local state
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [editorHasFocus, setEditorHasFocus] = React.useState(false)
  const [editorValue, setEditorValue] = React.useState(() => {
    // We use localStorage to persist a "draft" of the note while editing,
    // then clear it when the note is saved
    return localStorage.getItem(getStorageKey({ githubRepo, id })) ?? note?.content ?? defaultValue
  })
  const [mode, setMode] = React.useState<"read" | "write">(
    !note || editorValue !== note.content ? "write" : "read",
  )

  // If the note content changes and there is no pending draft in localStorage,
  // update the editor value
  if (
    note &&
    note.content !== editorValue &&
    localStorage.getItem(getStorageKey({ githubRepo, id })) === null
  ) {
    setEditorValue(note.content)
  }

  const handleEditorStateChange = React.useCallback((event: ViewUpdate) => {
    setEditorHasFocus(event.view.hasFocus)
  }, [])

  const handleChange = React.useCallback(
    (value: string) => {
      setEditorValue(value)
      localStorage.setItem(getStorageKey({ githubRepo, id }), value)
    },
    [githubRepo, id],
  )

  const switchToWriting = React.useCallback(() => {
    flushSync(() => {
      setMode("write")
    })

    const editor = editorRef.current

    if (editor) {
      // Focus the editor
      editor.view?.focus()
      // Move cursor to end of document
      editor.view?.dispatch({
        selection: EditorSelection.cursor(editor.view.state.doc.sliceString(0).length),
      })
    }
  }, [])

  const switchToReading = React.useCallback(() => {
    flushSync(() => {
      setMode("read")
    })
    cardRef.current?.focus({ preventScroll: true })
  }, [])

  const focusNextCard = React.useCallback(() => {
    if (cardRef.current) {
      const parentCard = cardRef.current
        .closest("[data-panel]")
        ?.querySelector<HTMLElement>("[data-note-id]")

      const siblingCards = Array.from(
        cardRef.current.parentElement?.querySelectorAll<HTMLElement>("[data-note-id]") || [],
      )

      const cards = Array.from(new Set([parentCard, ...siblingCards]).values()).filter(Boolean)

      const index = cards.indexOf(cardRef.current)

      // Focus the next note card
      if (cards[index + 1]) {
        cards[index + 1]?.focus()
      } else if (cards[index - 1]) {
        cards[index - 1]?.focus()
      }
    }
  }, [])

  const handleSave = React.useCallback(
    ({ id, content }: { id: NoteId; content: string }) => {
      // Only save if the content has changed
      if (content !== note?.content) {
        saveNote({ id, content })
      }
      localStorage.removeItem(getStorageKey({ githubRepo, id }))
    },
    [note, saveNote, githubRepo],
  )

  const handleDelete = React.useCallback(() => {
    // Move focus
    focusNextCard()

    // Update state
    deleteNote(id)
    setMode("write")

    // If the note is open in a panel, close it
    if (panel && panel.pathname.replace("/", "") === id && panel.index !== -1) {
      closePanel?.(panel.index, panel.id)
    }
  }, [focusNextCard, deleteNote, id, panel, closePanel])

  const isDirty = React.useMemo(() => {
    if (!note) {
      return editorValue !== defaultValue
    }

    return editorValue !== note.content
  }, [note, editorValue, defaultValue])

  return (
    <Card
      // Used for focus management
      data-note-id={id}
      ref={cardRef}
      tabIndex={0}
      focusVisible={selected || editorHasFocus}
      className="group flex flex-col"
      elevation={elevation}
      onDoubleClick={(event) => {
        if (mode === "read") {
          switchToWriting()
          event.preventDefault()
        }
      }}
      onKeyDown={(event) => {
        // Switch to writing with E
        if (mode === "read" && event.key === "e") {
          switchToWriting()
          event.preventDefault()
        }

        // Switch to reading with Command + Shift + P
        if (
          mode === "write" &&
          event.key === "p" &&
          (event.metaKey || event.ctrlKey) &&
          event.shiftKey
        ) {
          switchToReading()
          event.preventDefault()
        }

        // Copy markdown with Command + C if no text is selected
        if (
          mode === "read" &&
          (event.metaKey || event.ctrlKey) &&
          event.key == "c" &&
          !window.getSelection()?.toString()
        ) {
          copy(note?.content || "")
          event.preventDefault()
        }

        // Copy id with Command + Shift + C
        if (
          mode === "read" &&
          event.key == "c" &&
          event.shiftKey &&
          (event.metaKey || event.ctrlKey)
        ) {
          copy(id)
          event.preventDefault()
        }

        // Open dropdown with Command + .
        if (mode === "read" && event.key === "." && (event.metaKey || event.ctrlKey)) {
          setIsDropdownOpen(true)
          event.preventDefault()
        }

        // Delete note with Command + Backspace
        if (mode === "read" && event.key === "Backspace" && (event.metaKey || event.ctrlKey)) {
          handleDelete()
          event.preventDefault()
        }

        // Save note with Command + S
        if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
          handleSave({ id, content: editorValue })
          event.preventDefault()
        }

        // Save note and switch to reading with Command + Enter
        if (mode === "write" && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          handleSave({ id, content: editorValue })
          switchToReading()
          event.preventDefault()
        }

        // Switch between read and write mode with Command + E
        if (event.key === "e" && (event.metaKey || event.ctrlKey)) {
          if (mode === "read") {
            switchToWriting()
          } else {
            switchToReading()
          }
          event.preventDefault()
        }

        if (vimMode) {
          Vim.defineEx("w", "w", () => {
            handleSave({ id, content: editorValue })
          })
          Vim.defineEx("x", "x", () => {
            handleSave({ id, content: editorValue })
            switchToReading()
          })
          Vim.defineEx("wq", "wq", () => {
            handleSave({ id, content: editorValue })
            switchToReading()
          })
          Vim.defineEx("q", "q", () => {
            switchToReading()
          })
        }
      }}
    >
      <div className="sticky top-0 z-10 flex h-12 items-center justify-between gap-2 rounded-lg bg-bg px-2 coarse:h-14">
        <span className="flex items-center gap-1 overflow-hidden px-2 text-text-secondary">
          {note?.frontmatter.pinned === true ? (
            <PinFillIcon16 className="mr-1 flex-shrink-0 text-[var(--orange-11)]" />
          ) : null}
          {note ? (
            <Link to={`/${id}`} className="link filepath !no-underline hover:!underline">
              {id}.md
            </Link>
          ) : (
            <span className="filepath">{id}.md</span>
          )}
          {isDirty ? (
            <svg
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="var(--yellow-11)"
              className="flex-shrink-0"
            >
              <circle cx="8" cy="8" r="4" />
            </svg>
          ) : null}
          {note?.backlinks.length ? (
            <>
              <span>·</span>
              <span className="whitespace-nowrap">
                {pluralize(note.backlinks.length, "backlink")}
              </span>
            </>
          ) : null}
        </span>

        <div
          className={cx(
            "absolute right-2 top-2 flex rounded-lg bg-bg shadow-[0_0_4px_4px_var(--color-bg)] transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 fine:opacity-0",
            (mode === "write" || isDirty || isDropdownOpen || !note) && "!opacity-100",
          )}
        >
          {mode === "write" ? (
            <IconButton aria-label="Read mode" shortcut={["⌘", "E"]} onClick={switchToReading}>
              <GlassesIcon16 />
            </IconButton>
          ) : (
            <IconButton aria-label="Write mode" shortcut={["⌘", "E"]} onClick={switchToWriting}>
              <EditIcon16 />
            </IconButton>
          )}
          {note ? (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
              <DropdownMenu.Trigger asChild>
                <IconButton aria-label="Note actions" shortcut={["⌘", "."]} disableTooltip>
                  <MoreIcon16 />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  icon={<CopyIcon16 />}
                  onSelect={() => copy(note?.content || "")}
                  shortcut={["⌘", "C"]}
                >
                  Copy markdown
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<CopyIcon16 />}
                  onSelect={() => copy(id)}
                  shortcut={["⌘", "⇧", "C"]}
                >
                  Copy ID
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${githubRepo?.owner}/${githubRepo?.name}/blob/main/${id}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in GitHub
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<ShareIcon16 />}
                  onSelect={async () => {
                    if (!note) return

                    const url = await exportAsGist({
                      githubToken: githubUser?.token ?? "",
                      noteId: id,
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
                  onSelect={() => {
                    // Ask the user to confirm before deleting a note with backlinks
                    if (
                      note &&
                      note.backlinks.length > 0 &&
                      !window.confirm(
                        `${id}.md has ${pluralize(
                          note.backlinks.length,
                          "backlink",
                        )}. Are you sure you want to delete it?`,
                      )
                    ) {
                      return
                    }

                    handleDelete()
                  }}
                  shortcut={["⌘", "⌫"]}
                >
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          ) : null}
          {onCancel ? (
            <Button onClick={onCancel} className="ml-2">
              Cancel
            </Button>
          ) : null}
          {!note || isDirty ? (
            <Button
              variant="primary"
              onClick={() => {
                handleSave({ id, content: editorValue })
                switchToReading()
              }}
              shortcut={["⌘", "⏎"]}
              className="ml-2"
            >
              {!note ? "Create" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="p-4 pt-0">
        {mode === "read" ? (
          editorValue ? (
            <Markdown onChange={handleChange}>{editorValue}</Markdown>
          ) : (
            <span className="italic text-text-secondary">Empty note</span>
          )
        ) : null}

        <div hidden={mode === "read"}>
          <NoteEditor
            ref={editorRef}
            defaultValue={editorValue}
            onChange={handleChange}
            onStateChange={handleEditorStateChange}
            className="grid min-h-[12rem]"
          />
        </div>
      </div>
    </Card>
  )
})

function getStorageKey({ githubRepo, id }: { githubRepo: GitHubRepository | null; id: string }) {
  if (!githubRepo) return id
  return `${githubRepo.owner}/${githubRepo.name}/${id}`
}
