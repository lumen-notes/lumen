import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { useActor } from "@xstate/react"
import copy from "copy-to-clipboard"
import React from "react"
import { Link } from "react-router-dom"
import { GlobalStateContext, NoteId } from "../global-state"
import { pluralize } from "../utils/pluralize"
import { IconButton } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { MoreIcon16 } from "./icons"
import { Markdown } from "./markdown"
import { NoteForm } from "./note-form"

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
  const backlinks = state.context.backlinks[id]

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
        // Switch to editing with `command + e`
        if (event.metaKey && event.key === "e") {
          switchToEditing()
          event.preventDefault()
        }

        // Copy markdown with `command + c`
        if (event.metaKey && event.key == "c") {
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
      }}
    >
      <Markdown>{body}</Markdown>

      <div className="flex h-4 items-center justify-between">
        <span className="text-text-muted">
          <Link to={`/${id}`} className="tracking-wide underline underline-offset-2">
            {id}
          </Link>
          {backlinks?.length ? (
            <span>
              {" · "}
              {pluralize(backlinks.length, "backlink")}
            </span>
          ) : null}
        </span>
        <div className="-m-2">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenu.Trigger asChild>
              <IconButton aria-label="More actions">
                <MoreIcon16 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item onSelect={() => copy(body)} shortcut="⌘C">
                Copy markdown
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => copy(id)} shortcut="⌘⇧C">
                Copy ID
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={switchToEditing} shortcut="⌘E">
                Edit
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => {
                  globalState.service.send({ type: "DELETE_NOTE", id })
                }}
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
