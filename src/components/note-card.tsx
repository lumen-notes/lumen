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
    cardRef.current?.focus()
  }

  return (
    <Card
      ref={cardRef}
      tabIndex={0}
      onKeyDown={(event) => {
        // Switch to editing with `e`
        if (!isEditing && event.key === "e") {
          switchToEditing()
          event.preventDefault()
        }
      }}
    >
      {!isEditing ? (
        // View mode
        <div className="flex flex-col gap-6 p-4">
          <Markdown>{body}</Markdown>

          <div className="flex h-4 items-center justify-between">
            <span className="text-text-muted">
              <Link to={`/${id}`} className="tracking-wide  underline underline-offset-2">
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
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <IconButton aria-label="More actions">
                    <MoreIcon16 />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item onSelect={() => copy(id)}>Copy ID</DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => copy(body)}>Copy markdown</DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={switchToEditing}>Edit</DropdownMenu.Item>
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
        </div>
      ) : (
        // Edit mode
        <div className="p-2">
          <NoteForm
            key={body}
            id={id}
            defaultBody={body}
            codeMirrorViewRef={codeMirrorViewRef}
            onSubmit={switchToViewing}
            onCancel={switchToViewing}
          />
        </div>
      )}
    </Card>
  )
}
