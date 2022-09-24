import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useActor } from "@xstate/react"
import copy from "copy-to-clipboard"
import React from "react"
import { GlobalStateContext } from "../global-state"
import { NoteId } from "../types"
import { pluralize } from "../utils/pluralize"
import { IconButton } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { MoreIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteForm } from "./note-form"
import { Panels } from "./panels"

type NoteCardProps = {
  id: NoteId
}

export function NoteCard({ id }: NoteCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)

  const codeMirrorViewRef = React.useRef<EditorView>()

  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)

  const globalState = React.useContext(GlobalStateContext)

  // TODO: Use selectors to avoid unnecessary rerenders
  const [state] = useActor(globalState.service)

  const body = state.context.notes[id]
  const backlinks = state.context.backlinks[id] || []

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
      ref={cardRef}
      tabIndex={0}
      className="flex flex-col gap-6 p-4"
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
      <Markdown>{body}</Markdown>

      <div className="flex h-4 items-center justify-between">
        <span className="text-text-muted">
          <Panels.Link to={`/${id}`} className="link tracking-wide">
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
              <IconButton aria-label="Note actions" shortcut="⌘.">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onSelect={switchToEditing} shortcut="E">
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onSelect={() => copy(body)} shortcut="⌘C">
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => copy(id)} shortcut="⌘⇧C">
                Copy ID
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                onSelect={() => {
                  globalState.service.send({ type: "DELETE_NOTE", id })
                }}
                shortcut="⌘⌫"
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
      onSubmit={switchToViewing}
      onCancel={switchToViewing}
    />
  )
}
