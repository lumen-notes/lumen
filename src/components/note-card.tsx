import { EditorSelection } from "@codemirror/state"
import { ReactCodeMirrorRef } from "@uiw/react-codemirror"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import React from "react"
import { githubRepoAtom, githubUserAtom } from "../global-atoms"
import { NoteId } from "../types"
import { exportAsGist } from "../utils/export-as-gist"
import { useDeleteNote, useUpsertNote } from "../utils/github-sync"
import { pluralize } from "../utils/pluralize"
import { useNoteById } from "../utils/use-note-by-id"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  MoreIcon16,
  ShareIcon16,
  TrashIcon16,
} from "./icons"
import { useLink } from "./link-context"
import { Markdown } from "./markdown"
import { NoteCardForm } from "./note-card-form"
import { PanelContext, PanelsContext } from "./panels"
import { cx } from "../utils/cx"

type NoteCardProps = {
  id: NoteId
  elevation?: CardProps["elevation"]
  selected?: boolean
}

export function NoteCard({ id, elevation, selected = false }: NoteCardProps) {
  const note = useNoteById(id)
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const deleteNote = useDeleteNote()
  const upsertNote = useUpsertNote()
  const Link = useLink()

  // Refs
  const cardRef = React.useRef<HTMLDivElement>(null)
  const editorRef = React.useRef<ReactCodeMirrorRef>(null)

  // Panel context
  const { closePanel } = React.useContext(PanelsContext)
  const panel = React.useContext(PanelContext)

  // Local state
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const switchToEditing = React.useCallback(() => {
    setIsEditing(true)
    // Wait for the editor to mount
    setTimeout(() => {
      const editor = editorRef.current

      if (editor) {
        // Focus the editor
        editor.view?.focus()
        // Move cursor to end of document
        editor.view?.dispatch({
          selection: EditorSelection.cursor(editor.view.state.doc.sliceString(0).length),
        })
      }
    })
  }, [])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
    setTimeout(() => cardRef.current?.focus())
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

  const openNoteWindow = React.useCallback((id: string) => {
    const newWindowWidth = 600
    const newWindowHeight = 600
    window.open(
      `/${id}?fullscreen=true`,
      `${id}`,
      `width=${newWindowWidth}, height=${newWindowHeight}, top=${
        window.screen.height / 2 - newWindowHeight / 2
      }, left=${window.screen.width / 2 - newWindowWidth / 2}`,
    )
  }, [])

  const handleDeleteNote = React.useCallback(
    (id: string) => {
      // Move focus
      focusNextCard()

      // Update state
      deleteNote(id)

      // If the note is open in a panel, close it
      if (panel && panel.pathname.replace("/", "") === id && panel.index !== -1) {
        closePanel?.(panel.index)
      }
    },
    // [focusNextCard, panel, closePanel, send],
    [focusNextCard, deleteNote, panel, closePanel],
  )

  if (!note) {
    return <Card className="p-4">Not found</Card>
  }

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
          if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
            copy(note.rawBody)
            event.preventDefault()
          }

          // Copy id with `command + shift + c`
          if (event.metaKey && event.shiftKey && event.key == "c") {
            copy(id)
            event.preventDefault()
          }

          // Open dropdown with `command + .`
          if (event.key === "." && event.metaKey) {
            setIsDropdownOpen(true)
            event.preventDefault()
          }

          // Delete note with `command + backspace`
          if (event.metaKey && event.key === "Backspace") {
            handleDeleteNote(id)
            event.preventDefault()
          }

          // Open note in new window with `command + o`
          if (event.metaKey && event.key === "o") {
            openNoteWindow(id)
            event.preventDefault()
          }
        }}
      >
        <div className="p-4 pb-1">
          <Markdown onChange={(markdown) => upsertNote({ id, rawBody: markdown })}>
            {note.rawBody}
          </Markdown>
        </div>
        <div className="sticky bottom-0 -mt-2 flex items-center justify-between rounded-lg bg-bg-backdrop bg-gradient-to-t from-bg p-2 pt-4 backdrop-blur-md [mask-image:linear-gradient(to_top,black_75%,transparent)]">
          <span className="px-2 text-text-secondary">
            <Link target="_blank" to={`/${id}`} className="link font-mono tracking-wide">
              {id}.md
            </Link>
            {note.backlinks.length ? (
              <span>
                {" · "}
                {pluralize(note.backlinks.length, "backlink")}
              </span>
            ) : null}
          </span>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Note actions" shortcut={["⌘", "."]} tooltipSide="top">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item icon={<EditIcon16 />} onSelect={switchToEditing} shortcut={["E"]}>
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(note.rawBody)}
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
                onSelect={() => openNoteWindow(id)}
                shortcut={["⌘", "O"]}
              >
                Open in new window
              </DropdownMenu.Item>
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
                  const url = await exportAsGist({
                    githubToken: githubUser?.token ?? "",
                    noteId: id,
                    note,
                  })

                  // TODO: Show a toast

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
                onSelect={() => handleDeleteNote(id)}
                shortcut={["⌘", "⌫"]}
                disabled={note.backlinks.length > 0}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </Card>
      <div hidden={!isEditing}>
        <NoteCardForm
          editorRef={editorRef}
          key={note.rawBody}
          id={id}
          defaultValue={note.rawBody}
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
}
