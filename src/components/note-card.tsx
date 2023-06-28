import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import copy from "copy-to-clipboard"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React from "react"
import { githubRepoAtom, notesAtom } from "../global-atoms"
import { NoteId } from "../types"
import { useDeleteNote } from "../utils/github-sync"
import { pluralize } from "../utils/pluralize"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import { CopyIcon16, EditIcon16, ExternalLinkIcon16, MoreIcon16, TrashIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteForm } from "./note-form"
import { PanelContext, Panels, PanelsContext } from "./panels"

type NoteCardProps = {
  id: NoteId
  elevation?: CardProps["elevation"]
}

export function NoteCard({ id, elevation }: NoteCardProps) {
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (notes) => notes[id]), [id])
  const note = useAtomValue(noteAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const deleteNote = useDeleteNote()

  // Refs
  const cardRef = React.useRef<HTMLDivElement>(null)
  const codeMirrorViewRef = React.useRef<EditorView>()

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
      const view = codeMirrorViewRef.current
      if (view) {
        // Focus the editor
        view.focus()
        // Move cursor to end of document
        view.dispatch({
          selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
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

  const viewMode = (
    <Card
      // Used to focus the note card after creating it
      data-note-id={id}
      ref={cardRef}
      tabIndex={0}
      className="flex flex-col"
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
      }}
    >
      <div className="p-4 pb-1">
        <Markdown>{note.rawBody}</Markdown>
      </div>
      <div className="sticky bottom-0 flex items-center justify-between rounded-lg bg-bg-backdrop bg-gradient-to-t from-bg p-2 backdrop-blur-md">
        <span className="px-2 text-text-secondary">
          <Panels.Link target="_blank" to={`/${id}`} className="link tracking-wide">
            {id}
          </Panels.Link>
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
            {/* TODO: Hide this item on mobile */}
            <DropdownMenu.Item
              icon={<ExternalLinkIcon16 />}
              onSelect={() => {
                const newWindowWidth = 600
                const newWindowHeight = 600
                window.open(
                  `/${id}`,
                  `${id}`,
                  `toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${newWindowWidth}, height=${newWindowHeight}, top=${
                    window.screen.height / 2 - newWindowHeight / 2
                  }, left=${window.screen.width / 2 - newWindowWidth / 2}`,
                )
              }}
            >
              Open in new window
            </DropdownMenu.Item>
            {githubRepo ? (
              <DropdownMenu.Item
                icon={<ExternalLinkIcon16 />}
                href={`https://github.com/${githubRepo.owner}/${githubRepo.name}/blob/main/${id}.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in GitHub
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
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
  )

  const editMode = (
    <NoteForm
      key={note.rawBody}
      id={id}
      defaultValue={note.rawBody}
      codeMirrorViewRef={codeMirrorViewRef}
      elevation={elevation}
      onSubmit={switchToViewing}
      onCancel={switchToViewing}
    />
  )

  return !isEditing ? viewMode : editMode
}
