import { Link } from "@tanstack/react-router"
import React from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps, LiProps, Position } from "react-markdown/lib/ast-to-react"
import { useNetworkState } from "react-use"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { z } from "zod"
import { UPLOADS_DIR } from "../hooks/attach-file"
import { useNoteById } from "../hooks/note"
import { remarkEmbed } from "../remark-plugins/embed"
import { remarkTag } from "../remark-plugins/tag"
import { remarkWikilink } from "../remark-plugins/wikilink"
import { templateSchema } from "../schema"
import { cx } from "../utils/cx"
import {
  getVisibleFrontmatter,
  parseFrontmatter,
  updateFrontmatterKey,
  updateFrontmatterValue,
} from "../utils/frontmatter"
import { isNoteEmpty } from "../utils/parse-note"
import { removeTemplateFrontmatter } from "../utils/remove-template-frontmatter"
import { Checkbox } from "./checkbox"
import { CopyButton } from "./copy-button"
import { Details } from "./details"
import { FilePreview } from "./file-preview"
import { GitHubAvatar } from "./github-avatar"
import { ErrorIcon16 } from "./icons"
import { NoteLink } from "./note-link"
import { PillButton } from "./pill-button"
import { PropertyKeyEditor } from "./property-key"
import { PropertyValueEditor } from "./property-value"
import { SyntaxHighlighter, TemplateSyntaxHighlighter } from "./syntax-highlighter"
import { TagLink } from "./tag-link"
import { Tooltip } from "./tooltip"
import { WebsiteFavicon } from "./website-favicon"

export type MarkdownProps = {
  children: string
  className?: string
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
  ({
    children,
    className,
    hideFrontmatter = false,
    fontSize = "large",
    onChange,
  }: MarkdownProps) => {
    const { online } = useNetworkState()
    const { frontmatter, content } = React.useMemo(() => parseFrontmatter(children), [children])
    const visibleFrontmatter = React.useMemo(
      () => getVisibleFrontmatter(frontmatter),
      [frontmatter],
    )

    // Split the content into title and body so we can display
    // the frontmatter below the title but above the body.
    const [title, body] = React.useMemo(() => {
      return content.startsWith("# ")
        ? // Grab the first line as the title and remove it from the body
          [content.split("\n")[0], content.replace(content.split("\n")[0], "").trim()]
        : ["", content]
    }, [content])

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
        <div className={cx("font-content", className)}>
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
                <div className="mb-4 inline-flex">
                  <BookCover isbn={`${frontmatter.isbn}`} />
                </div>
              ) : null}
              {typeof frontmatter?.github === "string" && online ? (
                // If the note has a GitHub username, show the GitHub avatar
                <div className="mb-4 inline-flex">
                  <GitHubAvatar login={frontmatter.github} size={64} />
                </div>
              ) : null}
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-5 empty:hidden">
                  {title ? <MarkdownContent>{title}</MarkdownContent> : null}
                  {visibleFrontmatter &&
                  !hideFrontmatter &&
                  !isObjectEmpty(visibleFrontmatter) ? (
                    <Details>
                      <Details.Summary>Properties</Details.Summary>
                      <div className="-mx-2 coarse:-mx-3">
                        <Frontmatter
                          frontmatter={visibleFrontmatter}
                          onKeyChange={(oldKey, newKey) =>
                            onChange?.(
                              updateFrontmatterKey({
                                content: children,
                                oldKey,
                                newKey,
                              }),
                            )
                          }
                          onValueChange={(key, newValue) =>
                            onChange?.(
                              updateFrontmatterValue({
                                content: children,
                                properties: { [key]: newValue },
                              }),
                            )
                          }
                        />
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
                    // If there's no content and no visible frontmatter, show a placeholder
                    isNoteEmpty({ markdown: children, hideFrontmatter }) ? (
                      <span className="text-text-tertiary italic font-sans">Empty note</span>
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
      className="inline-block rounded-sm bg-bg-secondary shadow-sm eink:shadow-none transition-[box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
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
  onKeyChange,
  onValueChange,
}: {
  frontmatter: Record<string, unknown>
  className?: string
  onKeyChange?: (oldKey: string, newKey: string) => void
  onValueChange?: (key: string, value: unknown) => void
}) {
  if (Object.keys(frontmatter).length === 0) return null

  return (
    <div className={cx("@container empty:hidden grid gap-2", className)}>
      {Object.entries(frontmatter).map(([key, value], i) => {
        return (
          <div key={i} className="grid grid-cols-[2fr_3fr] gap-1 @[24rem]:grid-cols-[10rem_1fr]">
            <PropertyKeyEditor name={key} onChange={(newName) => onKeyChange?.(key, newName)} />
            <PropertyValueEditor
              property={[key, value]}
              onChange={(newValue) => onValueChange?.(key, newValue)}
            />
          </div>
        )
      })}
    </div>
  )
}

const anchorUrlSchema = z.union([z.string().url(), z.tuple([z.string().url()])])

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
  const parsedChildren = anchorUrlSchema.safeParse(props.children)
  if (parsedChildren.success) {
    const urlText =
      typeof parsedChildren.data === "string" ? parsedChildren.data : parsedChildren.data[0]
    children = urlText.replace(/^https?:\/\//, "").replace(/\/$/, "")
  }

  // Check if the link contains only a single image element
  const isSingleImageChild = React.isValidElement(props.children)
    ? props.children.type === "img" || props.children.type === Image
    : Array.isArray(props.children) &&
      props.children.length === 1 &&
      React.isValidElement(props.children[0]) &&
      ((props.children[0] as React.ReactElement).type === "img" ||
        (props.children[0] as React.ReactElement).type === Image)

  const link = (
    <a
      ref={ref}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
      className={cx(
        // Break long links
        parsedChildren.success && "[word-break:break-all]",
        // Add external link styling for non-image HTTP(S) links
        props.href?.startsWith("http") && !isSingleImageChild && "link-external",
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

function Code({ className, inline, children, ...props }: CodeProps) {
  if (className?.includes("language-math")) {
    return <div>{children}</div>
  }

  if (inline) {
    return <code className={className}>{children}</code>
  }

  const language = className?.replace("language-", "")

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

/**
 * Checks if the given element is the first child of its parent.
 * If there is a text node before the element, it is NOT considered the first child.
 */
function checkIsFirst(element: HTMLElement) {
  return element.previousSibling === null
}
