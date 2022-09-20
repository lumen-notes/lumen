import * as HoverCard from "@radix-ui/react-hover-card"
import { useActor } from "@xstate/react"
import React from "react"
import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"
import remarkGfm from "remark-gfm"
import { GlobalStateContext } from "../global-state"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { Card } from "./card"
import { Panels } from "./panels"
import { Tooltip } from "./tooltip"

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
        // @ts-ignore I don't know how to extend the list of accepted component keys
        noteLink: NoteLink,
        // @ts-ignore
        tagLink: TagLink,
        // @ts-ignore
        dateLink: DateLink,
        // Open external links in a new tab
        a: (props) => {
          const isExternal = props.href?.startsWith("http")

          if (isExternal) {
            // eslint-disable-next-line jsx-a11y/anchor-has-content
            return <a target="_blank" rel="noopener noreferrer" {...props} />
          }

          return <Link to={props.href || ""}>{props.children}</Link>
        },
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
          <Card className="z-20 w-96 px-4 py-3" elevation={1}>
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
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Panels.Link className="text-text-muted" to={`/tags/${name}`}>
          #{name}
        </Panels.Link>
      </Tooltip.Trigger>
      <Tooltip.Content>{pluralize(notesCount, "note")}</Tooltip.Content>
    </Tooltip>
  )
}

type DateLinkProps = {
  date: string
}

function DateLink({ date }: DateLinkProps) {
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Panels.Link to={`/dates/${date}`}>{formatDate(date)}</Panels.Link>
      </Tooltip.Trigger>
      <Tooltip.Content>{formatDateDistance(date)}</Tooltip.Content>
    </Tooltip>
  )
}
