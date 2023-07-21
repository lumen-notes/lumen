import * as HoverCard from "@radix-ui/react-hover-card"
import { isToday } from "date-fns"
import { useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import qs from "qs"
import React from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps } from "react-markdown/lib/ast-to-react"
import remarkGfm from "remark-gfm"
import { sentenceCase } from "sentence-case"
import { notesAtom } from "../global-atoms"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { cx } from "../utils/cx"
import {
  MONTH_NAMES,
  formatDate,
  formatDateDistance,
  getNextBirthday,
  toDateString,
  toDateStringUtc,
} from "../utils/date"
import { parseFrontmatter } from "../utils/parse-frontmatter"
import { UPLOADS_DIRECTORY } from "../utils/use-attach-file"
import { useSearchNotes } from "../utils/use-search-notes"
import { Card } from "./card"
import { FilePreview } from "./file-preview"
import {
  GitHubIcon16,
  GlobeIcon16,
  InstagramIcon16,
  MailIcon16,
  PhoneIcon16,
  TwitterIcon16,
  YouTubeIcon16,
} from "./icons"
import { useLink } from "./link-context"
import { SyntaxHighlighter } from "./syntax-highlighter"
import { Tooltip } from "./tooltip"

export type MarkdownProps = {
  children: string
}

export const Markdown = React.memo(({ children }: MarkdownProps) => {
  const { frontmatter, content } = React.useMemo(() => parseFrontmatter(children), [children])

  return (
    <div>
      {typeof frontmatter?.template === "string" ? (
        <>
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-block rounded-full border border-dashed border-border px-2 leading-5 text-text-secondary">
              Template
            </span>
            <span>{frontmatter.template}</span>
          </div>
          {/* Render template as a code block */}
          <MarkdownBody>{`\`\`\`\`\n${children // Remove the template frontmatter
            .replace(/template:.*\n/, "")
            // Remove empty frontmatter
            .replace(/---[\s]*---[\s]*/, "")}\n\`\`\`\``}</MarkdownBody>
        </>
      ) : (
        <>
          {frontmatter?.isbn ? (
            // If the note has an ISBN, show the book cover
            <div className="mb-3 inline-flex" data-testid="book-cover">
              <BookCover isbn={`${frontmatter.isbn}`} />
            </div>
          ) : null}
          {typeof frontmatter?.github === "string" ? (
            // If the note has a GitHub username, show the GitHub avatar
            <div className="mb-3 inline-flex">
              <GitHubAvatar username={frontmatter.github} />
            </div>
          ) : null}
          <MarkdownBody>{content}</MarkdownBody>
          <Frontmatter frontmatter={frontmatter} />
        </>
      )}
    </div>
  )
})

function MarkdownBody({ children }: { children: string }) {
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
        // Delegate rendering of the <pre> element to the Code component
        pre: ({ children }) => <>{children}</>,
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

function Frontmatter({ frontmatter }: { frontmatter: Record<string, unknown> }) {
  if (Object.keys(frontmatter).length === 0) return null
  return (
    <div className="mt-4 divide-y divide-border-secondary border-t border-border-secondary">
      {Object.entries(frontmatter).map(([key, value]) => {
        return (
          <div key={key} className="grid gap-1 py-2 last:pb-0">
            <h3 className="text-sm/4 text-text-secondary">{formatFrontmatterKey(key)}</h3>
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
  const Link = useLink()

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

    case "website": {
      if (typeof value !== "string") break
      const hasProtocol = value.startsWith("http://") || value.startsWith("https://")
      return (
        <div className="flex items-center gap-2">
          <div className="text-text-secondary">
            <GlobeIcon16 />
          </div>
          <a
            className="link link-external"
            href={hasProtocol ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Remove protocol and trailing slash from the displayed URL */}
            {value.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        </div>
      )
    }

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
      if (typeof value !== "string") break
      return (
        <div>
          <a
            className="link link-external "
            href={`https://openlibrary.org/isbn/${value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {value}
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
            <Link className="link" target="_blank" to={`/calendar?date=${dateString}`}>
              {formatDate(dateString, { excludeDayOfWeek: true })}
            </Link>
          ) : (
            <span>
              {MONTH_NAMES[month].slice(0, 3)} {day}
            </span>
          )}
          <span className="text-text-secondary">
            {" · "}
            <Link className="link" target="_blank" to={`/calendar?date=${nextBirthdayString}`}>
              {nextAge ? `${withSuffix(nextAge)} birthday` : "Birthday"}
            </Link>{" "}
            is {formatDateDistance(toDateStringUtc(nextBirthday)).toLowerCase()}{" "}
            {isBirthdayToday ? "🎂" : null}
          </span>
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

  // If value is a list of strings, render it as a markdown list
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return <Markdown>{value.map((v) => `- ${v}`).join("\n")}</Markdown>
  }

  return <code>{JSON.stringify(value)}</code>
}

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

function Link(props: React.ComponentPropsWithoutRef<"a">) {
  const Link = useLink()

  // Open uploads in a panel
  if (props.href?.startsWith(`/${UPLOADS_DIRECTORY}`)) {
    return (
      <Link target="_blank" to={`/file?${qs.stringify({ path: props.href })}`}>
        {props.children}
      </Link>
    )
  }

  // Render relative links with React Router
  if (props.href?.startsWith("/")) {
    return <Link to={props.href}>{props.children}</Link>
  }

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={cx(
        // Break long links
        String(props.children).startsWith("http") && "[word-break:break-all]",
        // Insert favicon before h1 links
        'before:my-1 before:mr-2 before:hidden before:h-4 before:w-4 before:bg-contain before:bg-center before:bg-no-repeat before:align-text-bottom before:content-[""] before:[background-image:var(--favicon-url)] [h1:first-child_>_&:first-child]:before:inline-block',
        props.className,
      )}
      style={{
        // @ts-expect-error
        "--favicon-url": `url(https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
          props.href ?? "",
        )}&size=32)`,
      }}
    />
  )
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

function Code({ className, inline, children }: CodeProps) {
  if (inline) {
    return <code className={className}>{children}</code>
  }

  const language = className?.replace("language-", "")

  if (language === "query") {
    // Display the results of a query instead of the query itself
    return <QueryResults query={String(children)} />
  }

  return (
    <pre>
      <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
    </pre>
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
      {results.map(([id, note]) => (
        <li key={id}>
          <NoteLink id={id} text={note.title || id} />
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
  const noteAtom = React.useMemo(() => selectAtom(notesAtom, (n) => n[id]), [id])
  const note = useAtomValue(noteAtom)
  const Link = useLink()
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
            className="z-20 w-96 p-4 animate-in fade-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            elevation={1}
          >
            <Markdown>{note?.rawBody ?? "Not found"}</Markdown>
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
  return (
    <span className="text-text-secondary">
      #
      {name.split("/").map((part, i) => {
        return (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            <Link
              target="_blank"
              className="text-text-secondary"
              to={`/tags/${name
                .split("/")
                .slice(0, i + 1)
                .join("/")}`}
            >
              {part}
            </Link>
          </React.Fragment>
        )
      })}
    </span>
  )
}

type DateLinkProps = {
  date: string
  className?: string
}

function DateLink({ date, className }: DateLinkProps) {
  const Link = useLink()
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <Link className={className} target="_blank" to={`/calendar?date=${date}`}>
          {formatDate(date)}
        </Link>
      </Tooltip.Trigger>
      <Tooltip.Content>{formatDateDistance(date)}</Tooltip.Content>
    </Tooltip>
  )
}
