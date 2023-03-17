import * as HoverCard from "@radix-ui/react-hover-card"
import Prism from "prismjs"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-diff"
import "prismjs/components/prism-json"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-yaml"
import qs from "qs"
import React from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps } from "react-markdown/lib/ast-to-react"
import remarkGfm from "remark-gfm"
import { GlobalStateContext } from "../global-state.machine"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { formatDate, formatDateDistance } from "../utils/date"
import { pluralize } from "../utils/pluralize"
import { Card } from "./card"
import { FilePreview } from "./file-preview"
import { useLink } from "./link-context"
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
        a: Link,
        img: Image,
        code: Code,
        // @ts-ignore I don't know how to extend the list of accepted component keys
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

function Link(props: React.ComponentPropsWithoutRef<"a">) {
  const Link = useLink()

  // Open local files in a panel
  if (props.href?.startsWith("/")) {
    return (
      <Link target="_blank" to={`/file?${qs.stringify({ path: props.href })}`}>
        {props.children}
      </Link>
    )
  }

  // eslint-disable-next-line jsx-a11y/anchor-has-content
  return <a target="_blank" rel="noopener noreferrer" {...props} />
}

function Image(props: React.ComponentPropsWithoutRef<"img">) {
  const Link = useLink()

  // Render local files with FilePreview
  if (props.src?.startsWith("/")) {
    return (
      <Link
        target="_blank"
        to={`/file?${qs.stringify({ path: props.src })}`}
        className="block w-fit !no-underline"
      >
        <FilePreview path={props.src} alt={props.alt} />
      </Link>
    )
  }

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />
}

function Code({ className, children }: CodeProps) {
  const language = className?.replace(/language-/, "") || ""

  if (language && Prism.languages[language]) {
    // Apply syntax highlighting
    const html = Prism.highlight(String(children), Prism.languages[language], language)

    return <code className={className} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <code className={className}>{children}</code>
}

type NoteLinkProps = {
  id: string
  text: string
}

function NoteLink({ id, text }: NoteLinkProps) {
  const Link = useLink()
  const [state] = GlobalStateContext.useActor()
  const { body } = state.context.notes[id]
  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link target="_blank" to={`/${id}`}>
          {text}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" sideOffset={4} asChild>
          <Card
            className="z-20 w-96 px-4 py-3 animate-in fade-in data-[side=top]:slide-in-from-bottom-2 data-[side=right]:slide-in-from-left-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2"
            elevation={1}
          >
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
  const Link = useLink()
  const [state] = GlobalStateContext.useActor()
  const notesCount = state.context.tags[name]?.length ?? 0
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Link target="_blank" className="text-text-secondary" to={`/tags/${name}`}>
          #{name}
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Content>{pluralize(notesCount, "note")}</Tooltip.Content>
    </Tooltip>
  )
}

type DateLinkProps = {
  date: string
}

function DateLink({ date }: DateLinkProps) {
  const Link = useLink()
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Link target="_blank" to={`/dates/${date}`}>
          {formatDate(date)}
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Content>{formatDateDistance(date)}</Tooltip.Content>
    </Tooltip>
  )
}
