import * as HoverCard from "@radix-ui/react-hover-card"
import { isToday } from "date-fns"
import qs from "qs"
import React from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps, LiProps, Position } from "react-markdown/lib/ast-to-react"
import { useNetworkState } from "react-use"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { sentenceCase } from "sentence-case"
import { z } from "zod"
import { UPLOADS_DIR } from "../hooks/attach-file"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { remarkNoteEmbed } from "../remark-plugins/note-embed"
import { remarkWikilink } from "../remark-plugins/wikilink"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { templateSchema } from "../schema"
import { cx } from "../utils/cx"
import {
  MONTH_NAMES,
  formatDate,
  formatDateDistance,
  getNextBirthday,
  isValidDateString,
  toDateString,
  toDateStringUtc,
} from "../utils/date"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { removeTemplateFrontmatter } from "../utils/remove-template-frontmatter"
import { Card } from "./card"
import { Checkbox } from "./checkbox"
import { CopyButton } from "./copy-button"
import { FilePreview } from "./file-preview"
import { GitHubAvatar } from "./github-avatar"
import {
  ErrorIcon16,
  GitHubIcon16,
  InstagramIcon16,
  MailIcon16,
  PhoneIcon16,
  TwitterIcon16,
  YouTubeIcon16,
} from "./icons"
import { Link } from "./link"
import { NoteFavicon } from "./note-favicon"
import { SyntaxHighlighter, TemplateSyntaxHighlighter } from "./syntax-highlighter"
import { TagLink } from "./tag-link"
import { WebsiteFavicon } from "./website-favicon"

export type MarkdownProps = {
  children: string
  hideFrontmatter?: boolean
  onChange?: (value: string) => void
}

const MarkdownContext = React.createContext<{
  markdown: string
  onChange?: (value: string) => void
}>({
  markdown: "",
})

export const Markdown = React.memo(
  ({ children, hideFrontmatter = false, onChange }: MarkdownProps) => {
    const { online } = useNetworkState()
    const { frontmatter, content } = React.useMemo(() => parseFrontmatter(children), [children])

    // Split the content into title and body so we can display
    // the frontmatter below the title but above the body.
    const [title, body] = React.useMemo(
      () =>
        content.startsWith("# ")
          ? // Grab the first line as the title and remove it from the body
            [content.split("\n")[0], content.replace(content.split("\n")[0], "").trim()]
          : ["", content],
      [content],
    )

    const parsedTemplate = templateSchema.omit({ body: true }).safeParse(frontmatter.template)

    const contextValue = React.useMemo(
      () => ({
        markdown: body,
        onChange: (value: string) => onChange?.(children.replace(body, value)),
      }),
      [body, children, onChange],
    )

    return (
      <MarkdownContext.Provider value={contextValue}>
        <div>
          {parsedTemplate.success ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold leading-4">{parsedTemplate.data.name}</h1>
                <span className="inline-block rounded-full border border-dashed border-border px-2 leading-5 text-text-secondary">
                  Template
                </span>
              </div>
              {/* TODO: Display more input metadata (type, description, etc.) */}
              {parsedTemplate.data.inputs ? (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-text-secondary">Inputs</span>
                  <div className="flex flex-row flex-wrap gap-x-2 gap-y-1">
                    {Object.entries(parsedTemplate.data.inputs).map(([name]) => (
                      <div key={name}>
                        <code className="rounded-xs bg-bg-secondary px-1">{name}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {/* Render template as a code block */}
              <pre className="overflow-auto rounded-sm bg-bg-code-block p-3">
                <TemplateSyntaxHighlighter>
                  {removeTemplateFrontmatter(children)}
                </TemplateSyntaxHighlighter>
              </pre>
            </div>
          ) : (
            <>
              {frontmatter?.isbn && online ? (
                // If the note has an ISBN, show the book cover
                <div className="mb-3 inline-flex">
                  <BookCover isbn={`${frontmatter.isbn}`} />
                </div>
              ) : null}
              {typeof frontmatter?.github === "string" && online ? (
                // If the note has a GitHub username, show the GitHub avatar
                <div className="mb-3 inline-flex">
                  <GitHubAvatar login={frontmatter.github} />
                </div>
              ) : null}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 empty:hidden">
                  {title ? <MarkdownContent>{title}</MarkdownContent> : null}
                  {!hideFrontmatter && !isObjectEmpty(frontmatter) ? (
                    <Frontmatter frontmatter={frontmatter} />
                  ) : null}
                </div>
                {body ? <MarkdownContent>{body}</MarkdownContent> : null}
              </div>
            </>
          )}
        </div>
      </MarkdownContext.Provider>
    )
  },
)

function isObjectEmpty(obj: Record<string, unknown>) {
  return Object.keys(obj).length === 0
}

function MarkdownContent({ children, className }: { children: string; className?: string }) {
  return (
    <ReactMarkdown
      className={cx("markdown", className)}
      remarkPlugins={[
        remarkGfm,
        // remarkEmoji,
        remarkWikilink,
        remarkNoteEmbed,
        remarkTagLink,
        remarkMath,
      ]}
      rehypePlugins={[rehypeKatex]}
      remarkRehypeOptions={{
        handlers: {
          // TODO: Improve type-safety of `node`
          rehypeKatex(h, node) {
            return h(node, "math", {
              output: "mathml",
            })
          },
          wikilink(h, node) {
            return h(node, "wikilink", {
              id: node.data.id,
              text: node.data.text,
            })
          },
          noteEmbed(h, node) {
            return h(node, "noteEmbed", {
              id: node.data.id,
              text: node.data.text,
            })
          },
          tagLink(h, node) {
            return h(node, "tagLink", {
              name: node.data.name,
            })
          },
        },
      }}
      components={{
        a: Anchor,
        img: Image,
        input: CheckboxInput,
        li: ListItem,
        // Delegate rendering of the <pre> element to the Code component
        pre: ({ children }) => <>{children}</>,
        code: Code,
        // @ts-ignore I don't know how to extend the list of accepted component keys
        wikilink: NoteLink,
        // @ts-ignore
        noteEmbed: NoteEmbed,
        // @ts-ignore
        tagLink: TagLink,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

function BookCover({ isbn }: { isbn: string }) {
  return (
    <a
      className="focus-ring inline-block aspect-[2/3] h-14 rounded-xs bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary transition-[box-shadow,transform] [transform-origin:center_left] hover:shadow-md hover:[transform:perspective(30rem)_scale(1.05)_rotate3d(0,1,0,-20deg)]"
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

function Frontmatter({
  frontmatter,
  className,
}: {
  frontmatter: Record<string, unknown>
  className?: string
}) {
  if (Object.keys(frontmatter).length === 0) return null

  return (
    <div className={cx("@container", className)}>
      {Object.entries(frontmatter)
        // Filter out empty values
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => {
          return (
            <div key={key} className="grid gap-1 py-2 last:pb-0 @[24rem]:grid-cols-[10rem_1fr]">
              <h3 className="text-sm/4 text-text-secondary @[24rem]:text-base/6">
                {formatFrontmatterKey(key)}
              </h3>
              <FrontmatterValue entry={[key, value]} />
            </div>
          )
        })}
    </div>
  )
}

function formatFrontmatterKey(key: string) {
  switch (key) {
    case "isbn":
      return "ISBN"
    case "github":
      return "GitHub"
    default:
      return sentenceCase(key)
  }
}

function FrontmatterValue({ entry: [key, value] }: { entry: [string, unknown] }) {
  // Recognized frontmatter keys
  switch (key) {
    case "phone":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <div className="text-text-secondary">
            <PhoneIcon16 />
          </div>
          <a className="link" href={`tel:${value}`}>
            {value}
          </a>
        </div>
      )

    case "email":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <div className="text-text-secondary">
            <MailIcon16 />
          </div>
          <a className="link" href={`mailto:${value}`}>
            {value}
          </a>
        </div>
      )

    case "address":
      if (typeof value !== "string") break
      return (
        <div>
          <a
            className="link link-external"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        </div>
      )

    case "isbn":
      return (
        <div>
          <a
            className="link link-external "
            href={`https://openlibrary.org/isbn/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {`${value}`}
          </a>
        </div>
      )

    case "github":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <GitHubIcon16 />
          <a
            className="link link-external"
            href={`https://github.com/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        </div>
      )

    case "twitter":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <TwitterIcon16 />
          <a
            className="link link-external"
            href={`https://twitter.com/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        </div>
      )

    case "youtube":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <YouTubeIcon16 />
          <a
            className="link link-external"
            href={`https://youtube.com/@${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        </div>
      )

    case "instagram":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <InstagramIcon16 />
          <a
            className="link link-external"
            href={`https://instagram.com/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
          </a>
        </div>
      )

    case "birthday": {
      // Skip if value is not a date or string in the format "MM-DD"
      if (!(value instanceof Date || (typeof value === "string" && /^\d{2}-\d{2}$/.test(value)))) {
        break
      }

      const year = value instanceof Date ? value.getUTCFullYear() : null
      const month = value instanceof Date ? value.getUTCMonth() : parseInt(value.split("-")[0]) - 1
      const day = value instanceof Date ? value.getUTCDate() : parseInt(value.split("-")[1])
      const dateString = value instanceof Date ? toDateStringUtc(value) : null

      const nextBirthday = getNextBirthday(new Date(year ?? 0, month, day))
      const nextBirthdayString = toDateString(nextBirthday)
      const nextAge = year ? nextBirthday.getUTCFullYear() - year : null
      const isBirthdayToday = isToday(nextBirthday)

      return (
        <span>
          {dateString ? (
            <Link className="link" target="_blank" to={`/${dateString}`}>
              {formatDate(dateString, { excludeDayOfWeek: true })}
            </Link>
          ) : (
            <span>
              {MONTH_NAMES[month].slice(0, 3)} {day}
            </span>
          )}
          <span className="text-text-secondary">
            {" · "}
            <Link className="link" target="_blank" to={`/${nextBirthdayString}`}>
              {nextAge ? `${withSuffix(nextAge)} birthday` : "Birthday"}
            </Link>{" "}
            is {formatDateDistance(toDateStringUtc(nextBirthday)).toLowerCase()}{" "}
            {isBirthdayToday ? "🎂" : null}
          </span>
        </span>
      )
    }

    case "tags": {
      const tagsSchema = z.array(z.string().regex(/^[a-zA-Z][\w-/]*$/))
      const parsedTags = tagsSchema.safeParse(value)
      if (!parsedTags.success) break

      return (
        <span className="inline-flex flex-wrap gap-x-2 gap-y-1">
          {parsedTags.data.map((tag) => (
            <TagLink key={tag} name={tag} />
          ))}
        </span>
      )
    }
  }

  // If value is a string, render it as markdown
  if (typeof value === "string") {
    return <Markdown>{value}</Markdown>
  }

  // If value is a date, render it as a link to the date page
  if (value instanceof Date) {
    const dateString = toDateStringUtc(value)
    return (
      <div>
        <DateLink className="link" date={dateString} />
      </div>
    )
  }

  // If value is a list of strings or numbers, render it as a markdown list
  if (Array.isArray(value) && value.every((v) => typeof v === "string" || typeof v === "number")) {
    return <Markdown>{value.map((v) => `- ${v}`).join("\n")}</Markdown>
  }

  return <code>{JSON.stringify(value)}</code>
}

/** Adds the appropriate suffix to a number (e.g. "1st", "2nd", "3rd", "4th", etc.) */
function withSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`
  }

  switch (lastDigit) {
    case 1:
      return `${num}st`
    case 2:
      return `${num}nd`
    case 3:
      return `${num}rd`
    default:
      return `${num}th`
  }
}

function Anchor(props: React.ComponentPropsWithoutRef<"a">) {
  const ref = React.useRef<HTMLAnchorElement>(null)
  const [isFirst, setIsFirst] = React.useState(false)
  const { online } = useNetworkState()

  React.useLayoutEffect(() => {
    if (ref.current) {
      setIsFirst(checkIsFirst(ref.current))
    }
  }, [])

  // Open uploads in a panel
  if (props.href?.startsWith(UPLOADS_DIR)) {
    return (
      <Link to={`/file?${qs.stringify({ path: props.href })}`} target="_blank">
        {props.children}
      </Link>
    )
  }

  // Render relative links with React Router
  if (props.href?.startsWith("/")) {
    return <Link to={props.href}>{props.children}</Link>
  }

  let children: React.ReactNode = props.children

  // If the text content of the link is a URL, remove the protocol and trailing slash
  const urlSchema = z.tuple([z.string().url()])
  const parsedChildren = urlSchema.safeParse(props.children)
  if (parsedChildren.success) {
    children = parsedChildren.data[0].replace(/^https?:\/\//, "").replace(/\/$/, "")
  }

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      ref={ref}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={cx(
        // Break long links
        String(props.children).startsWith("http") && "[word-break:break-all]",
        props.className,
      )}
    >
      {isFirst && online ? (
        <WebsiteFavicon url={props.href ?? ""} className="mr-2 align-sub [h1>a>&]:align-baseline" />
      ) : null}
      {children}
    </a>
  )
}

function Image(props: React.ComponentPropsWithoutRef<"img">) {
  // Render local files with FilePreview
  if (props.src?.startsWith("/")) {
    return (
      <Link
        to={`/file?${qs.stringify({ path: props.src })}`}
        target="_blank"
        className="block w-fit !no-underline"
      >
        <FilePreview path={props.src} alt={props.alt} />
      </Link>
    )
  }

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />
}

function Code({ className, inline, children }: CodeProps) {
  if (className?.includes("language-math")) {
    return <div>{children}</div>
  }

  if (inline) {
    return <code className={className}>{children}</code>
  }

  const language = className?.replace("language-", "")

  if (language === "query") {
    // Display the results of a query instead of the query itself
    return <QueryResults query={String(children)} />
  }

  return (
    <div className="relative">
      <pre className="!pe-12">
        <div className="absolute end-2 top-2 rounded-sm bg-bg-code-block">
          <CopyButton text={children.toString()} />
        </div>
        <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
      </pre>
    </div>
  )
}

const TaskListItemContext = React.createContext<{
  position?: Position
} | null>(null)

function ListItem({ node, ordered, index, ...props }: LiProps) {
  const isTaskListItem = props.className?.includes("task-list-item")

  if (isTaskListItem) {
    return (
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      <TaskListItemContext.Provider value={{ position: node.position }}>
        <li {...props} />
      </TaskListItemContext.Provider>
    )
  }

  return <li {...props} />
}

function CheckboxInput({ checked }: { checked?: boolean }) {
  const { markdown, onChange } = React.useContext(MarkdownContext)
  const { position } = React.useContext(TaskListItemContext) ?? {}
  const checkedRef = React.useRef<HTMLButtonElement>(null)

  return (
    <Checkbox
      ref={checkedRef}
      checked={checked}
      disabled={!onChange}
      onCheckedChange={(checked) => {
        if (!position) return

        // Update the corresponding checkbox in the markdown string
        const newValue =
          markdown.slice(0, position.start.offset) +
          (checked ? "- [x]" : "- [ ]") +
          markdown.slice((position.start.offset ?? 0) + 5)

        onChange?.(newValue)
      }}
    />
  )
}

type QueryResultsProps = {
  query: string
}

// TODO: All results should contain backlinks to the note that contains the query
function QueryResults({ query }: QueryResultsProps) {
  const searchNote = useSearchNotes()

  const results = React.useMemo(() => searchNote(query), [searchNote, query])

  return (
    <ul>
      {results.map((note) => (
        <li key={note.id}>
          <NoteLink id={note.id} text={note.title || note.id} />
        </li>
      ))}
    </ul>
  )
}

type NoteLinkProps = {
  id: string
  text: string
}

function NoteLink({ id, text }: NoteLinkProps) {
  const note = useNoteById(id)
  const ref = React.useRef<HTMLAnchorElement>(null)
  const [isFirst, setIsFirst] = React.useState(false)
  const { online } = useNetworkState()

  React.useLayoutEffect(() => {
    if (ref.current) {
      setIsFirst(checkIsFirst(ref.current))
    }
  }, [])

  if (isValidDateString(id)) {
    return <DateLink date={id} text={text} />
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link ref={ref} to={`/${id}`} target="_blank">
          {isFirst && note && online ? (
            <NoteFavicon
              note={note}
              className="mr-2 align-sub [h1>a>&]:align-baseline"
              defaultFavicon={null}
            />
          ) : null}
          {text}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" sideOffset={4} asChild>
          <Card
            className="z-20 w-96 p-4 animate-in fade-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            elevation={2}
          >
            {note ? (
              <Markdown>{note.content}</Markdown>
            ) : (
              <span className="flex items-center gap-2 text-text-danger">
                <ErrorIcon16 />
                File not found
              </span>
            )}
          </Card>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

type NoteEmbedProps = {
  id: string
}

function NoteEmbed({ id }: NoteEmbedProps) {
  const note = useNoteById(id)

  return (
    <div className="relative pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:rounded-full before:bg-border before:content-['']">
      {note ? (
        <Markdown hideFrontmatter>{note.content}</Markdown>
      ) : (
        <span className="flex items-center gap-2 text-text-danger">
          <ErrorIcon16 />
          File not found
        </span>
      )}
      <div className="mt-2 text-sm text-text-secondary">
        <Link target="_blank" to={`/${id}`}>
          Source
        </Link>
      </div>
    </div>
  )
}

type DateLinkProps = {
  date: string
  text?: string
  className?: string
}

function DateLink({ date, text, className }: DateLinkProps) {
  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link className={className} to={`/${date}`} target="_blank">
          {text || formatDate(date)}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content side="top" sideOffset={4} asChild>
          <Card
            className="z-20 rounded-md p-2 leading-none text-text animate-in fade-in after:rounded-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            elevation={2}
          >
            {formatDateDistance(date)}
          </Card>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

/**
 * Checks if the given element is the first child of its parent.
 * If there is a text node before the element, it is NOT considered the first child.
 */
function checkIsFirst(element: HTMLElement) {
  return element.previousSibling === null
}
