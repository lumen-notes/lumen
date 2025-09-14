import * as HoverCard from "@radix-ui/react-hover-card"
import { Link } from "@tanstack/react-router"
import { isToday } from "date-fns"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps, LiProps, Position } from "react-markdown/lib/ast-to-react"
import { useNetworkState } from "react-use"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { z } from "zod"
import { notesAtom } from "../global-state"
import { UPLOADS_DIR } from "../hooks/attach-file"
import { useNoteById } from "../hooks/note"
import { useSearchNotes } from "../hooks/search"
import { remarkEmbed } from "../remark-plugins/embed"
import { remarkTag } from "../remark-plugins/tag"
import { remarkWikilink } from "../remark-plugins/wikilink"
import { templateSchema } from "../schema"
import { cx } from "../utils/cx"
import {
  MONTH_NAMES,
  formatDate,
  formatDateDistance,
  formatWeek,
  formatWeekDistance,
  getNextBirthday,
  isValidDateString,
  isValidWeekString,
  toDateString,
  toDateStringUtc,
} from "../utils/date"
import { parseFrontmatter } from "../utils/frontmatter"
import { removeTemplateFrontmatter } from "../utils/remove-template-frontmatter"
import { Checkbox } from "./checkbox"
import { CopyButton } from "./copy-button"
import { Details } from "./details"
import { FilePreview } from "./file-preview"
import { GitHubAvatar } from "./github-avatar"
import {
  BlueskyIcon16,
  ErrorIcon16,
  GitHubIcon16,
  InstagramIcon16,
  TwitterIcon16,
  YouTubeIcon16,
} from "./icons"
import { NoteFavicon } from "./note-favicon"
import { NotePreview } from "./note-preview"
import { PillButton } from "./pill-button"
import { SyntaxHighlighter, TemplateSyntaxHighlighter } from "./syntax-highlighter"
import { TagLink } from "./tag-link"
import { Tooltip } from "./tooltip"
import { WebsiteFavicon } from "./website-favicon"

export type MarkdownProps = {
  children: string
  hideFrontmatter?: boolean
  fontSize?: "small" | "large"
  onChange?: (value: string) => void
}

const MarkdownContext = React.createContext<{
  markdown: string
  onChange?: (value: string) => void
}>({
  markdown: "",
})

export const Markdown = React.memo(
  ({ children, hideFrontmatter = false, fontSize = "large", onChange }: MarkdownProps) => {
    const { online } = useNetworkState()
    const { frontmatter, content } = React.useMemo(() => parseFrontmatter(children), [children])
    const filteredFrontmatter = React.useMemo(() => {
      return Object.fromEntries(
        Object.entries(frontmatter).filter(([key, value]) => {
          // Skip reserved frontmatter keys
          if (["pinned", "gist_id", "font", "width"].includes(key)) return false

          // Filter out empty arrays
          if (Array.isArray(value) && value.length === 0) return false

          // Filter out empty values
          return Boolean(value)
        }),
      )
    }, [frontmatter])

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

    const parsedTemplate = templateSchema.omit({ body: true }).safeParse(frontmatter?.template)

    const contextValue = React.useMemo(
      () => ({
        markdown: body,
        onChange: (value: string) => onChange?.(children.replace(body, value)),
      }),
      [body, children, onChange],
    )

    return (
      <MarkdownContext.Provider value={contextValue}>
        <div className="font-content">
          {parsedTemplate.success ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-5">{parsedTemplate.data.name}</h1>
                <PillButton variant="dashed" asChild>
                  <Link to="/" search={{ query: "type:template", view: "grid" }}>
                    Template
                  </Link>
                </PillButton>
              </div>
              {/* TODO: Display more input metadata (type, description, etc.) */}
              {parsedTemplate.data.inputs ? (
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-sm text-text-secondary">Inputs</span>
                  <div className="flex flex-row flex-wrap gap-x-2 gap-y-1">
                    {Object.entries(parsedTemplate.data.inputs).map(([name]) => (
                      <div key={name}>
                        <code className="rounded-sm bg-bg-secondary px-1">{name}</code>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {/* Render template as a code block */}
              <div
                className="markdown"
                style={
                  fontSize === "large"
                    ? ({
                        "--font-size-base": "16px",
                        "--font-size-sm": "14px",
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <pre>
                  <TemplateSyntaxHighlighter>
                    {removeTemplateFrontmatter(children)}
                  </TemplateSyntaxHighlighter>
                </pre>
              </div>
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
                  <GitHubAvatar login={frontmatter.github} size={64} className="!size-16" />
                </div>
              ) : null}
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-5 empty:hidden">
                  {title ? <MarkdownContent>{title}</MarkdownContent> : null}
                  {filteredFrontmatter &&
                  !hideFrontmatter &&
                  !isObjectEmpty(filteredFrontmatter) ? (
                    <Details>
                      <Details.Summary>Properties</Details.Summary>
                      <div className="pl-6">
                        <Frontmatter frontmatter={filteredFrontmatter} />
                      </div>
                    </Details>
                  ) : null}
                </div>
                <div
                  className="empty:hidden"
                  style={
                    fontSize === "large"
                      ? ({
                          "--font-size-base": "16px",
                          "--font-size-sm": "14px",
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {
                    // If there's no title, no body, and no frontmatter, show a placeholder
                    !title &&
                    !body &&
                    (!filteredFrontmatter ||
                      isObjectEmpty(filteredFrontmatter) ||
                      hideFrontmatter) ? (
                      <MarkdownContent className="text-text-secondary">
                        _Empty note_
                      </MarkdownContent>
                    ) : body ? (
                      <MarkdownContent>{body}</MarkdownContent>
                    ) : null
                  }
                </div>
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
        remarkEmbed,
        remarkTag,
        [remarkMath, { singleDollarTextMath: false }],
      ]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
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
          embed(h, node) {
            return h(node, "embed", {
              id: node.data.id,
              text: node.data.text,
            })
          },
          tag(h, node) {
            return h(node, "tag", {
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
        embed: NoteEmbed,
        // @ts-ignore
        tag: TagLink,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

function BookCover({ isbn }: { isbn: string }) {
  return (
    <a
      className="inline-block rounded-sm bg-bg-secondary shadow-sm transition-[box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      href={`https://openlibrary.org/isbn/${isbn}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
        alt="Book cover"
        className="aspect-[2/3] h-20 rounded-sm"
      />
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
    <div className={cx("@container empty:hidden", className)}>
      {Object.entries(frontmatter).map(([key, value]) => {
        return (
          <div
            key={key}
            className="grid gap-1 py-2 first:pt-0 last:pb-0 @[24rem]:grid-cols-[10rem_1fr]"
          >
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
  // switch (key) {
  //   case "isbn":
  //     return "ISBN"
  //   case "github":
  //     return "GitHub"
  //   default:
  //     return sentenceCase(key)
  // }
  return key
}

function FrontmatterValue({ entry: [key, value] }: { entry: [string, unknown] }) {
  // Recognized frontmatter keys
  switch (key) {
    case "phone":
      if (typeof value !== "string") break
      return (
        <a className="link" href={`tel:${value}`}>
          {value}
        </a>
      )

    case "email":
      if (typeof value !== "string") break
      return (
        <a className="link" href={`mailto:${value}`}>
          {value}
        </a>
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
            className="link link-external"
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

    case "bluesky":
      if (typeof value !== "string") break
      return (
        <div className="flex items-center gap-2">
          <BlueskyIcon16 />
          <a
            className="link link-external"
            href={`https://bsky.app/profile/${value}`}
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
            <Link
              className="link"
              to="/notes/$"
              params={{ _splat: dateString }}
              search={{
                mode: "read",
                query: undefined,
                view: "grid",
              }}
            >
              {formatDate(dateString, { excludeDayOfWeek: true })}
            </Link>
          ) : (
            <span>
              {MONTH_NAMES[month].slice(0, 3)} {day}
            </span>
          )}
          <span className="mx-2 text-text-secondary">·</span>
          <span className="text-text-secondary">
            {nextAge ? `${withSuffix(nextAge)} birthday` : "Birthday"} is{" "}
            <Link
              className="link"
              to="/notes/$"
              params={{ _splat: nextBirthdayString }}
              search={{
                mode: "read",
                query: undefined,
                view: "grid",
              }}
            >
              {formatDateDistance(toDateStringUtc(nextBirthday)).toLowerCase()}
            </Link>{" "}
            {isBirthdayToday ? "🎂" : null}
          </span>
        </span>
      )
    }

    case "tags": {
      const tagsSchema = z.array(z.string().regex(/^[\p{L}][\p{L}\p{N}_\-/]*$/u))
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
    return <Markdown fontSize="small">{value}</Markdown>
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
    return <Markdown fontSize="small">{value.map((v) => `- ${v}`).join("\n")}</Markdown>
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

  // Transform upload link
  if (props.href?.startsWith(UPLOADS_DIR)) {
    return (
      <Link
        to="/file"
        search={{
          path: props.href,
        }}
      >
        {props.children}
      </Link>
    )
  }

  // Render relative links with client-side routing
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

  const link = (
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
        <WebsiteFavicon
          url={props.href ?? ""}
          className="mr-2 [h1>a>&]:inline-block hidden align-baseline"
        />
      ) : null}
      {children}
    </a>
  )

  // If the link text is not a URL, wrap it in a tooltip
  if (!parsedChildren.success) {
    return (
      <Tooltip>
        <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
        <Tooltip.Content side="bottom" className="flex items-center gap-2">
          {props.href ? <WebsiteFavicon url={props.href} className="align-sub" /> : null}
          <span className="inline-block max-w-[40vw] truncate leading-4">
            {props.href
              ?.replace(/^https?:\/\//, "")
              .replace(/^www\./, "")
              .replace(/\/$/, "")}
          </span>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return link
}

function Image(props: React.ComponentPropsWithoutRef<"img">) {
  // Render local files with FilePreview
  if (props.src?.startsWith("/")) {
    return (
      <Link
        to="/file"
        search={{
          path: props.src,
        }}
        className={cx("block w-fit !no-underline", props.className)}
        style={props.style}
      >
        <FilePreview path={props.src} alt={props.alt} width={props.width} height={props.height} />
      </Link>
    )
  }

  // Proxy external images
  if (props.src?.startsWith("http")) {
    const proxyUrl = `/file-proxy?url=${encodeURIComponent(props.src)}`
    return (
      <a href={props.src} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...props} src={proxyUrl} data-canonical-src={props.src} />
      </a>
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
      <pre className="!pe-12 print:whitespace-pre-wrap">
        <div className="absolute end-2 top-2 rounded bg-bg-code-block coarse:end-1 coarse:top-1 print:hidden">
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

  if (isValidWeekString(id)) {
    return <WeekLink week={id} text={text} />
  }

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          ref={ref}
          to="/notes/$"
          params={{ _splat: id }}
          search={{
            mode: "read",
            query: undefined,
            view: "grid",
          }}
        >
          {isFirst && note && online ? (
            <NoteFavicon
              note={note}
              content={note.content}
              className="mr-2 align-sub [h1>a>&]:align-baseline"
              defaultFavicon={null}
            />
          ) : null}
          {text || id}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align="start"
          className="card-2 !rounded-[calc(var(--border-radius-base)+6px)] z-20 w-96 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 print:hidden"
        >
          {note ? (
            <NotePreview note={note} />
          ) : (
            <span className="flex items-center gap-2 p-4 text-text-danger">
              <ErrorIcon16 />
              Note not found
            </span>
          )}
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
    <div className="relative pl-[calc(var(--font-size-base)*1.25)] before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:rounded-full before:bg-border before:content-['']">
      {note ? (
        <Markdown hideFrontmatter>{note.content}</Markdown>
      ) : (
        <span className="flex items-center gap-2 text-text-danger">
          <ErrorIcon16 />
          File not found
        </span>
      )}
      <div className="mt-2 text-sm text-text-secondary">
        <Link
          to="/notes/$"
          params={{ _splat: id }}
          search={{
            mode: "read",
            query: undefined,
            view: "grid",
          }}
        >
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
  const note = useNoteById(date)

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: date }}
          search={{
            mode: note ? "read" : "write",
            query: undefined,
            view: "grid",
          }}
        >
          {text || formatDate(date)}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align={note ? "start" : "center"}
          className="card-2 z-20 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2"
        >
          {note ? (
            <div className="w-96">
              <NotePreview note={note} />
            </div>
          ) : (
            <div className="p-2 leading-none text-text-secondary">{formatDateDistance(date)}</div>
          )}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  )
}

type WeekLinkProps = {
  week: string
  text?: string
  className?: string
}

function WeekLink({ week, text, className }: WeekLinkProps) {
  const hasWeekNote = useAtomValue(
    useMemo(() => selectAtom(notesAtom, (notes) => notes.has(week)), [week]),
  )

  return (
    <HoverCard.Root>
      <HoverCard.Trigger asChild>
        <Link
          className={className}
          to="/notes/$"
          params={{ _splat: week }}
          search={{
            mode: hasWeekNote ? "read" : "write",
            query: undefined,
            view: "grid",
          }}
        >
          {text || formatWeek(week)}
        </Link>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          side="bottom"
          sideOffset={4}
          align="center"
          className="card-2 z-20 animate-in fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 print:hidden"
        >
          <div className="p-2 leading-none text-text-secondary">{formatWeekDistance(week)}</div>
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
