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
import { formatDate } from "../utils/date"
import { Card } from "./card"

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
        tagLink({ name }) {
          return (
            <Link className="text-text-muted" to={`/tags/${name}`}>
              #{name}
            </Link>
          )
        },
        // @ts-ignore
        dateLink({ date }) {
          return <Link to={`/dates/${date}`}>{formatDate(date)}</Link>
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
        <Link to={`/${id}`}>{text}</Link>
      </HoverCard.Trigger>
      <HoverCard.Content side="top" sideOffset={4} asChild>
        <Card className="w-96 px-4 py-3" elevation={1}>
          <Markdown>{body ?? "Not found"}</Markdown>
        </Card>
      </HoverCard.Content>
    </HoverCard.Root>
  )
}
