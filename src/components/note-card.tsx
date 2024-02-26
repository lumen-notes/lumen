import { EditorSelection } from "@codemirror/state"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { flushSync } from "react-dom"
import { githubRepoAtom, githubUserAtom, globalStateMachineAtom } from "../global-state"
import { useDeleteNote, useNoteById, useSaveNote } from "../hooks/note"
import { NoteId } from "../schema"
import { cx } from "../utils/cx"
import { exportAsGist } from "../utils/export-as-gist"
import { pluralize } from "../utils/pluralize"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { useFullscreen } from "./fullscreen"
import { IconButton } from "./icon-button"
import {
  CopyIcon16,
  EditIcon16,
  ErrorIcon16,
  ExternalLinkIcon16,
  LoadingIcon16,
  MaximizeIcon16,
  MoreIcon16,
  ShareIcon16,
  TrashIcon16,
} from "./icons"
import { Link } from "./link"
import { Markdown } from "./markdown"
import { NoteCardForm } from "./note-card-form"
import { usePanel, usePanelActions } from "./panels"

const isResolvingRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.resolvingRepo"),
)

type NoteCardProps = {
  id: NoteId
  elevation?: CardProps["elevation"]
  selected?: boolean
}

export const NoteCard = React.memo(function NoteCard({
  id,
  elevation,
  selected = false,
}: NoteCardProps) {
  const note = useNoteById(id)
  const isResolvingRepo = useAtomValue(isResolvingRepoAtom)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const saveNote = useSaveNote()
  const deleteNote = useDeleteNote()
  const { openFullscreen } = useFullscreen()

  // Refs
  const cardRef = React.useRef<HTMLDivElement>(null)
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)

  // Panel context
  const { closePanel } = usePanelActions()
  const panel = usePanel()

  // Local state
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const switchToEditing = React.useCallback(() => {
    flushSync(() => {
      setIsEditing(true)
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

  const switchToViewing = React.useCallback(() => {
    flushSync(() => {
      setIsEditing(false)
    })
    cardRef.current?.focus()
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

  const handleDeleteNote = React.useCallback(
    (id: string) => {
      // Move focus
      focusNextCard()

      // Update state
      deleteNote(id)

      // If the note is open in a panel, close it
      if (panel && panel.pathname.replace("/", "") === id && panel.index !== -1) {
        closePanel?.(panel.index, panel.id)
      }
    },
    [focusNextCard, deleteNote, panel, closePanel],
  )

  return (
    <>
      <Card
        // Used for focus management
        data-note-id={id}
        ref={cardRef}
        tabIndex={0}
        focusVisible={selected}
        className={cx("flex flex-col", isEditing && "hidden")}
        elevation={elevation}
        onKeyDown={(event) => {
          // Switch to editing with `e`
          if (event.key === "e") {
            switchToEditing()
            event.preventDefault()
          }

          // Copy markdown with `command + c` if no text is selected
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key == "c" &&
            !window.getSelection()?.toString()
          ) {
            copy(note?.content || "")
            event.preventDefault()
          }

          // Copy id with `command + shift + c`
          if (event.metaKey && event.shiftKey && event.key == "c") {
            copy(id)
            event.preventDefault()
          }

          // Open dropdown with `command + .`
          if (event.key === "." && (event.metaKey || event.ctrlKey)) {
            setIsDropdownOpen(true)
            event.preventDefault()
          }

          // Delete note with `command + backspace`
          if ((event.metaKey || event.ctrlKey) && event.key === "Backspace") {
            handleDeleteNote(id)
            event.preventDefault()
          }

          // Open note in fullscreen mode with `shift + enter`
          if (event.shiftKey && event.key === "Enter") {
            openFullscreen(`/${id}`)
            event.preventDefault()
          }
        }}
      >
        <div className="flex items-center justify-between p-2">
          <span className="px-2 text-text-secondary">
            <Link
              target="_blank"
              to={`/${id}`}
              className="link filepath !no-underline hover:!underline"
            >
              {id}.md
            </Link>
            {note?.backlinks.length ? (
              <span>
                {" · "}
                {pluralize(note.backlinks.length, "backlink")}
              </span>
            ) : null}
          </span>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton
                aria-label="Note actions"
                shortcut={["⌘", "."]}
                tooltipSide="top"
                disabled={!note}
              >
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item icon={<EditIcon16 />} onSelect={switchToEditing} shortcut={["E"]}>
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                icon={<MaximizeIcon16 />}
                onSelect={() => openFullscreen(`/${id}`)}
                shortcut={["⇧", "⏎"]}
              >
                Open fullscreen
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
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
              {/* <DropdownMenu.Item
                icon={<ExternalLinkIcon16 />}
                onSelect={() => openNoteWindow(id)}
                shortcut={["⌘", "O"]}
              >
                Open in new window
              </DropdownMenu.Item> */}
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

                  handleDeleteNote(id)
                }}
                shortcut={["⌘", "⌫"]}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
        <div className="p-4 pt-0">
          {isResolvingRepo ? (
            <span className="flex items-center gap-2 text-text-secondary">
              <LoadingIcon16 />
              Loading…
            </span>
          ) : note ? (
            <Markdown onChange={(content) => saveNote({ id, content })}>{note.content}</Markdown>
          ) : (
            <span className="flex items-center gap-2 text-text-danger">
              <ErrorIcon16 />
              File not found
            </span>
          )}
        </div>
      </Card>
      <div hidden={!isEditing}>
        <NoteCardForm
          editorRef={editorRef}
          key={note?.content || ""}
          id={id}
          defaultValue={note?.content}
          elevation={elevation}
          selected={selected}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onSubmit={switchToViewing}
          onCancel={switchToViewing}
        />
      </div>
    </>
  )
})
