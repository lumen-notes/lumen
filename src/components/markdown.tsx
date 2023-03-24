import * as HoverCard from "@radix-ui/react-hover-card"
import qs from "qs"
import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { GlobalStateContext } from "../global-state.machine"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { formatDate, formatDateDistance } from "../utils/date"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { pluralize } from "../utils/pluralize"
import { Card } from "./card"
import { Code } from "./code"
import { FilePreview } from "./file-preview"
import { useLink } from "./link-context"
import { Tooltip } from "./tooltip"
import { stringify } from "yaml"

export type MarkdownProps = {
  children: string
}

export const Markdown = React.memo(({ children }: MarkdownProps) => {
  const { frontmatter, content } = React.useMemo(() => parseFrontmatter(children), [children])

  return (
    <div>
      {typeof frontmatter?.isbn === "string" ? (
        // If the note has an ISBN, show the book cover
        <div className="mb-3 inline-flex">
          <BookCover isbn={frontmatter.isbn} />
        </div>
      ) : null}
      {typeof frontmatter?.github === "string" ? (
        // If the note has a GitHub username, show the GitHub avatar
        <div className="mb-3 inline-flex">
          <GitHubAvatar username={frontmatter.github} />
        </div>
      ) : null}
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
        {content}
      </ReactMarkdown>

      {Object.keys(frontmatter).length > 0 ? (
        <pre className="mt-4 overflow-auto rounded-sm bg-bg-secondary p-3">
          <Code className="language-yaml">{stringify(frontmatter)}</Code>
        </pre>
      ) : null}
    </div>
  )
})

function BookCover({ isbn }: { isbn: string }) {
  return (
    <a
      className="focus-ring inline-block aspect-[4/6] h-14 rounded-xs bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary transition-[box-shadow,transform] [transform-origin:center_left] hover:shadow-md hover:[transform:perspective(30rem)_scale(1.05)_rotate3d(0,1,0,-20deg)]"
      href={`https://openlibrary.org/isbn/${isbn}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        backgroundImage: `url(https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg)`,
      }}
    >
      <span className="sr-only">Book cover</span>
    </a>
  )
}

function GitHubAvatar({ username }: { username: string }) {
  return (
    <div
      aria-hidden
      className="inline-block h-8 w-8 rounded-full bg-bg-secondary bg-cover ring-1 ring-inset ring-border-secondary"
      style={{
        backgroundImage: `url(https://github.com/${username}.png?size=64)`,
      }}
    />
  )
}

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
            className="z-20 w-96 p-4 animate-in fade-in data-[side=top]:slide-in-from-bottom-2 data-[side=right]:slide-in-from-left-2 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2"
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
