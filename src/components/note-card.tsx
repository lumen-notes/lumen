import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useActor } from "@xstate/react"
import copy from "copy-to-clipboard"
import React from "react"
import { GlobalStateContext } from "../global-state"
import { NoteId } from "../types"
import { pluralize } from "../utils/pluralize"
import { IconButton } from "./button"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { CopyIcon16, EditIcon16, MoreIcon16, TrashIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteForm } from "./note-form"
import { Panels } from "./panels"

type NoteCardProps = {
  id: NoteId
  elevation?: CardProps["elevation"]
}

export function NoteCard({ id, elevation }: NoteCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const codeMirrorViewRef = React.useRef<EditorView>()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const { body } = state.context.notes[id] ?? {}
  const backlinks = state.context.backlinks[id] ?? []

  if (typeof body === "undefined") {
    return <Card className="p-4">Not found</Card>
  }

  function switchToEditing() {
    setIsEditing(true)
    setTimeout(() => {
      const view = codeMirrorViewRef.current
      if (view) {
        view.focus()
        view.dispatch({
          selection: EditorSelection.cursor(view.state.doc.sliceString(0).length),
        })
      }
    })
  }

  function switchToViewing() {
    setIsEditing(false)
    setTimeout(() => cardRef.current?.focus())
  }

  return !isEditing ? (
    // View mode
    <Card
      // Used to focus the note card after creating it
      data-note-id={id}
      ref={cardRef}
      tabIndex={0}
      className="flex flex-col p-1"
      elevation={elevation}
      onKeyDown={(event) => {
        // Switch to editing with `e`
        if (event.key === "e") {
          switchToEditing()
          event.preventDefault()
        }

        // Copy markdown with `command + c` if no text is selected
        if (event.metaKey && event.key == "c" && !window.getSelection()?.toString()) {
          copy(body)
          event.preventDefault()
        }

        // Copy id with `command + shift + c`
        if (event.metaKey && event.shiftKey && event.key == "c") {
          copy(id)
          event.preventDefault()
        }

        // Open dropdown with `command + .`
        if (event.metaKey && event.key === ".") {
          setIsDropdownOpen(true)
          event.preventDefault()
        }

        // Delete note with `command + backspace`
        if (event.metaKey && event.key === "Backspace") {
          globalState.service.send("DELETE_NOTE", { id })
          event.preventDefault()
        }
      }}
    >
      <div className="p-3">
        <Markdown>{body}</Markdown>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between rounded-md bg-bg-backdrop p-3 backdrop-blur-md">
        <span className="leading-4 text-text-secondary">
          <Panels.Link target="_blank" to={`/${id}`} className="link tracking-wide">
            {id}
          </Panels.Link>
          {backlinks.length ? (
            <span>
              {" · "}
              {pluralize(backlinks.length, "backlink")}
            </span>
          ) : null}
        </span>
        <div className="-m-2">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="Note actions" shortcut={["⌘", "."]} tooltipSide="top">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item icon={<EditIcon16 />} onSelect={switchToEditing} shortcut={["E"]}>
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                icon={<CopyIcon16 />}
                onSelect={() => copy(body)}
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
                icon={<TrashIcon16 />}
                onSelect={() => {
                  globalState.service.send({ type: "DELETE_NOTE", id })
                }}
                shortcut={["⌘", "⌫"]}
                disabled={backlinks.length > 0}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  ) : (
    // Edit mode
    <NoteForm
      key={body}
      id={id}
      defaultBody={body}
      codeMirrorViewRef={codeMirrorViewRef}
      elevation={elevation}
      onSubmit={switchToViewing}
      onCancel={switchToViewing}
    />
  )
}
