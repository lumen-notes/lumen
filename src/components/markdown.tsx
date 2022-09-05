import * as HoverCard from "@radix-ui/react-hover-card"
import * as Tooltip from "@radix-ui/react-tooltip"
import { useActor } from "@xstate/react"
import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { GlobalStateContext } from "../global-state"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { Card } from "./card"
import { Panels } from "./panels"

type MarkdownProps = {
  children: string
}

export const Markdown = React.memo(({ children }: MarkdownProps) => {
  return (
    <ReactMarkdown
      className="markdown"
      remarkPlugins={[remarkGfm, remarkNoteLink, remarkTagLink, remarkDateLink]}
      remarkRehypeOptions={{
        handlers: {
          // TODO: Improve type-safety of `node`
          noteLink(h, node) {
            return h(node, "noteLink", {
              id: node.data.id,
              text: node.data.text,
            })
          },
          tagLink(h, node) {
            return h(node, "tagLink", {
              name: node.data.name,
            })
          },
          dateLink(h, node) {
            return h(node, "dateLink", {
              date: node.data.date,
            })
          },
        },
      }}
      components={{
        // @ts-ignore I'm not sure how to extend the list of accepted component keys
        noteLink: NoteLink,
        // @ts-ignore
        tagLink: TagLink,
        // @ts-ignore
        dateLink: DateLink,
      }}
    >
      {children}
    </ReactMarkdown>
  )
})

type NoteLinkProps = {
  id: string
  text: string
}

function NoteLink({ id, text }: NoteLinkProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const body = state.context.notes[id]
  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Panels.Link to={`/${id}`}>{text}</Panels.Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" sideOffset={4} asChild>
          <Card className="w-96 px-4 py-3" elevation={1}>
            <Markdown>{body ?? "Not found"}</Markdown>
          </Card>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

type TagLinkProps = {
  name: string
}

function TagLink({ name }: TagLinkProps) {
  const globalState = React.useContext(GlobalStateContext)
  const [state] = useActor(globalState.service)
  const notesCount = state.context.tags[name]?.length ?? 0
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Panels.Link className="text-text-muted" to={`/tags/${name}`}>
          #{name}
        </Panels.Link>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" sideOffset={4} asChild>
          <Card elevation={1} className="py-1 px-2 text-text-muted">
            {pluralize(notesCount, "note")}
          </Card>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

type DateLinkProps = {
  date: string
}

function DateLink({ date }: DateLinkProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <Panels.Link to={`/dates/${date}`}>{formatDate(date)}</Panels.Link>
      </Tooltip.Trigger>
      <Tooltip.Content side="top" sideOffset={4} asChild>
        <Card elevation={1} className="py-1 px-2 text-text-muted">
          {formatDateDistance(date)}
        </Card>
      </Tooltip.Content>
    </Tooltip.Root>
  )
}
