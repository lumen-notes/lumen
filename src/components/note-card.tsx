import { EditorSelection } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import copy from "copy-to-clipboard"
import React from "react"
import { GlobalStateContext } from "../global-state.machine"
import { NoteId } from "../types"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { pluralize } from "../utils/pluralize"
import { Card, CardProps } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import { IconButton } from "./icon-button"
import {
  CopyIcon16,
  EditIcon16,
  ExternalLinkIcon16,
  GitHubIcon16,
  MoreIcon16,
  TrashIcon16,
  TwitterIcon16,
} from "./icons"
import { Markdown } from "./markdown"
import { NoteForm } from "./note-form"
import { Panels } from "./panels"

// Map frontmatter keys to note action menu items
const frontmatterMap: Record<string, (value: unknown) => React.ReactElement | null> = {
  github: (value) => {
    if (typeof value !== "string") return null
    return (
      <DropdownMenu.Item
        icon={<GitHubIcon16 />}
        href={`https://github.com/${value}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        GitHub profile
      </DropdownMenu.Item>
    )
  },
  twitter: (value) => {
    if (typeof value !== "string") return null
    return (
      <DropdownMenu.Item
        icon={<TwitterIcon16 />}
        href={`https://twitter.com/${value}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Twitter profile
      </DropdownMenu.Item>
    )
  },
}

type NoteCardProps = {
  id: NoteId
  elevation?: CardProps["elevation"]
}

export function NoteCard({ id, elevation }: NoteCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const codeMirrorViewRef = React.useRef<EditorView>()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false)
  const [state, send] = GlobalStateContext.useActor()
  const { body } = state.context.notes[id] ?? {}
  const backlinks = state.context.backlinks[id] ?? []
  const isPending = !state.matches("pushingNotes") && state.context.pendingChanges.upsert.has(id)
  const { frontmatter = {} } = parseFrontmatter(body ?? "")

  const frontmatterItems = React.useMemo(() => {
    return Object.entries(frontmatterMap)
      .map(([key, value]) => value(frontmatter[key]))
      .filter(Boolean)
  }, [frontmatter])

  const switchToEditing = React.useCallback(() => {
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
  }, [])

  const switchToViewing = React.useCallback(() => {
    setIsEditing(false)
    setTimeout(() => cardRef.current?.focus())
  }, [])

  const focusNextCard = React.useCallback(() => {
    if (cardRef.current) {
      const siblings = Array.from(cardRef.current.parentElement?.children ?? []) as HTMLElement[]
      const index = siblings.indexOf(cardRef.current)

      // Focus the next note card
      if (siblings[index + 1]) {
        siblings[index + 1].focus()
      } else if (siblings[index - 1]) {
        siblings[index - 1].focus()
      }
    }
  }, [])

  if (body === undefined) {
    return <Card className="p-4">Not found</Card>
  }

  return !isEditing ? (
    // View mode
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
          copy(body)
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
          focusNextCard()
          send({ type: "DELETE_NOTE", id })
          event.preventDefault()
        }
      }}
    >
      <div className="p-4 pb-1">
        <Markdown>{body}</Markdown>
      </div>
      <div className="sticky bottom-0 flex items-center justify-between rounded-lg bg-bg-backdrop bg-gradient-to-t from-bg p-2 backdrop-blur-md">
        <span className="px-2 text-text-secondary">
          <Panels.Link target="_blank" to={`/${id}`} className="link tracking-wide">
            {id}
          </Panels.Link>
          {backlinks.length ? (
            <span>
              {" · "}
              {pluralize(backlinks.length, "backlink")}
            </span>
          ) : null}
          {isPending ? (
            <span>
              {" · "}
              <span className="rounded-full bg-bg-pending px-2 text-text-pending">Not pushed</span>
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
            {frontmatterItems.length ? (
              <>
                <DropdownMenu.Separator />
                {frontmatterItems}
              </>
            ) : null}
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
            {state.context.repoOwner && state.context.repoName ? (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                  icon={<ExternalLinkIcon16 />}
                  href={`https://github.com/${state.context.repoOwner}/${state.context.repoName}/blob/main/${id}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in GitHub
                </DropdownMenu.Item>
              </>
            ) : null}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              icon={<TrashIcon16 />}
              onSelect={() => {
                focusNextCard()
                send({ type: "DELETE_NOTE", id })
              }}
              shortcut={["⌘", "⌫"]}
              disabled={backlinks.length > 0}
            >
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
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
