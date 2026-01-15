import { Link } from "@tanstack/react-router"
import { addDays } from "date-fns"
import React from "react"
import ReactMarkdown from "react-markdown"
import { CodeProps, LiProps } from "react-markdown/lib/ast-to-react"
import { useNetworkState } from "react-use"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import { z } from "zod"
import { UPLOADS_DIR } from "../hooks/attach-file"
import { useNoteById } from "../hooks/note"
import { useMoveTask } from "../hooks/task"
import { formatDate, toDateString } from "../utils/date"
import { remarkEmbed } from "../remark-plugins/embed"
import { remarkPriority } from "../remark-plugins/priority"
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
import { DropdownMenu } from "./dropdown-menu"
import { FilePreview } from "./file-preview"
import { GitHubAvatar } from "./github-avatar"
import { IconButton } from "./icon-button"
import {
  CalendarDateIcon16,
  CopyIcon16,
  CutIcon16,
  ErrorIcon16,
  MoreIcon16,
  TrashIcon16,
} from "./icons"
import { NoteLink } from "./note-link"
import { PillButton } from "./pill-button"
import { PriorityIndicator } from "./priority-indicator"
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
  emptyText?: string
  noteId?: string
}

const MarkdownContext = React.createContext<{
  markdown: string
  onChange?: (value: string) => void
  noteId?: string
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
    emptyText = "Empty",
    noteId,
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
        onChange: onChange ? (value: string) => onChange(children.replace(body, value)) : undefined,
        noteId,
      }),
      [body, children, onChange, noteId],
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
              <div className={cx("markdown", fontSize === "large" && "markdown-large")}>
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
                  {!hideFrontmatter && !isObjectEmpty(visibleFrontmatter) ? (
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
                <div className={cx("empty:hidden", fontSize === "large" && "markdown-large")}>
                  {
                    // If there's no content and no visible frontmatter, show a placeholder
                    isNoteEmpty({ markdown: children, hideFrontmatter }) ? (
                      <span className="text-text-tertiary italic font-sans">{emptyText}</span>
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
        remarkPriority,
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
          priority(h, node) {
            return h(node, "priority", {
              level: node.data.level,
            })
          },
        },
      }}
      components={{
        a: Anchor,
        img: Image,
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
        // @ts-ignore
        priority: PriorityIndicator,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

function BookCover({ isbn }: { isbn: string }) {
  return (
    <a
      className="book-cover inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      href={`https://openlibrary.org/isbn/${isbn}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`}
        alt="Book cover"
        className="aspect-[2/3] h-[120px] bg-bg-tertiary"
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
        <Tooltip.Trigger render={link} />
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
    <div className="pre-container relative">
      <pre className="!pe-12 print:whitespace-pre-wrap">
        <div className="absolute end-2 top-2 rounded coarse:end-1 coarse:top-1 print:hidden">
          <CopyButton text={children.toString()} />
        </div>
        <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
      </pre>
    </div>
  )
}

function extractListItemElements(children: React.ReactNode): {
  checkbox: { checked: boolean } | null
  content: React.ReactNode
  nestedLists: React.ReactElement[]
} {
  let checkbox: { checked: boolean } | null = null
  const nestedLists: React.ReactElement[] = []

  function removeCheckboxFromChildren(children: React.ReactNode): React.ReactNode {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child

      if (child.type === "input") {
        checkbox = { checked: (child.props as { checked?: boolean }).checked ?? false }
        return null
      }

      return child
    })
  }

  const content = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child

    // Extract checkbox from direct child
    if (child.type === "input") {
      checkbox = { checked: (child.props as { checked?: boolean }).checked ?? false }
      return null
    }

    // Extract nested lists (ul or ol)
    if (child.type === "ul" || child.type === "ol") {
      nestedLists.push(child)
      return null
    }

    // Check inside p tags for checkbox (multi-paragraph case)
    if (child.type === "p" && child.props.children) {
      const newChildren = removeCheckboxFromChildren(child.props.children)
      return React.cloneElement(child, {}, newChildren)
    }

    return child
  })

  return { checkbox, content, nestedLists }
}

function ListItem({ node, children, ordered, className, ...props }: LiProps) {
  const { markdown, onChange, noteId } = React.useContext(MarkdownContext)
  const isTask = className?.includes("task-list-item")
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const moveTask = useMoveTask()

  const { checkbox, content, nestedLists } = React.useMemo(
    () => extractListItemElements(children),
    [children],
  )

  const handleMoveTo = React.useCallback(
    (targetNoteId: string) => {
      if (!node.position || !noteId) return
      moveTask({
        sourceNoteId: noteId,
        targetNoteId,
        sourceMarkdown: markdown,
        nodeStart: node.position.start.offset ?? 0,
        nodeEnd: node.position.end.offset ?? 0,
      })
    },
    [markdown, moveTask, node.position, noteId],
  )

  // Memoize date options to avoid recalculating on every render
  const dateOptions = React.useMemo(() => {
    const now = new Date()
    const today = now
    const tomorrow = addDays(now, 1)
    const todayId = toDateString(today)
    const tomorrowId = toDateString(tomorrow)

    type DateOption = {
      label: string
      icon: React.ReactNode
      targetId: string
      trailingText: string
    }

    const options: DateOption[] = []

    // Today/Tomorrow: only show if not already on that note
    if (noteId !== todayId) {
      options.push({
        label: "Today",
        icon: <CalendarDateIcon16 date={today.getDate()} />,
        targetId: todayId,
        trailingText: formatDate(todayId),
      })
    }
    if (noteId !== tomorrowId) {
      options.push({
        label: "Tomorrow",
        icon: <CalendarDateIcon16 date={tomorrow.getDate()} />,
        targetId: tomorrowId,
        trailingText: formatDate(tomorrowId),
      })
    }

    return options
  }, [noteId])

  // Get the task line text for copy/cut operations
  const getTaskLine = React.useCallback(() => {
    if (!node.position) return ""
    let start = node.position.start.offset ?? 0
    while (start > 0 && markdown[start - 1] !== "\n") {
      start--
    }
    const end = node.position.end.offset ?? 0
    return markdown.slice(start, end).trim()
  }, [markdown, node.position])

  const deleteTask = React.useCallback(() => {
    if (!node.position) return
    let start = node.position.start.offset ?? 0
    while (start > 0 && markdown[start - 1] !== "\n") {
      start--
    }
    const end = node.position.end.offset ?? 0
    const endWithNewline = markdown[end] === "\n" ? end + 1 : end
    onChange?.(markdown.slice(0, start) + markdown.slice(endWithNewline))
  }, [markdown, node.position, onChange])

  return (
    <li
      {...props}
      className={cx("transition-colors rounded-lg", isMenuOpen && "bg-bg-selection ", className)}
    >
      <div
        className={cx("flex p-1.5 gap-1.5", {
          "relative pr-10 coarse:pr-12 group/task": isTask && onChange,
        })}
      >
        <div className="size-7 coarse:size-9 shrink-0 grid place-items-center">
          {isTask ? (
            <Checkbox
              key={String(checkbox?.checked)}
              defaultChecked={checkbox?.checked}
              disabled={!onChange}
              onMouseDown={(event) => {
                // Prevent double-click from propagating
                if (event.detail > 1) {
                  event.stopPropagation()
                }
              }}
              onCheckedChange={(newChecked) => {
                if (!node.position) return

                // Update the corresponding checkbox in the markdown string
                const newValue =
                  markdown.slice(0, node.position.start.offset) +
                  (newChecked ? "- [x]" : "- [ ]") +
                  markdown.slice((node.position.start.offset ?? 0) + 5)

                onChange?.(newValue)
              }}
            />
          ) : ordered ? (
            <span className="list-item-number text-text-secondary justify-self-end" />
          ) : (
            <svg
              width="4"
              height="4"
              viewBox="0 0 4 4"
              fill="currentColor"
              className="text-text-secondary"
            >
              <circle cx="2" cy="2" r="2" />
            </svg>
          )}
        </div>
        <div className="first-child:mt-0 last-child:mt-0 grow coarse:py-1">{content}</div>
        {isTask && onChange ? (
          <div className="absolute top-1 right-1">
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
              <DropdownMenu.Trigger
                render={
                  <IconButton
                    aria-label="Task actions"
                    tooltipSide="top"
                    className={cx(
                      "opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100 coarse:opacity-100",
                      isMenuOpen && "opacity-100",
                    )}
                  >
                    <MoreIcon16 />
                  </IconButton>
                }
              />
              <DropdownMenu.Content align="end" width={280} sideOffset={8} alignOffset={-4}>
                {noteId && dateOptions.length > 0 ? (
                  <>
                    <DropdownMenu.Group>
                      <DropdownMenu.GroupLabel>Move to</DropdownMenu.GroupLabel>
                      {dateOptions.map((option) => (
                        <DropdownMenu.Item
                          key={option.targetId}
                          icon={option.icon}
                          onClick={() => handleMoveTo(option.targetId)}
                          trailingVisual={
                            <span className="text-text-secondary">{option.trailingText}</span>
                          }
                        >
                          {option.label}
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.Group>
                    <DropdownMenu.Separator />
                  </>
                ) : null}
                <DropdownMenu.Item
                  icon={<CopyIcon16 />}
                  onClick={() => navigator.clipboard.writeText(getTaskLine())}
                >
                  Copy task
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  icon={<CutIcon16 />}
                  onClick={() => {
                    navigator.clipboard.writeText(getTaskLine())
                    deleteTask()
                  }}
                >
                  Cut task
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item variant="danger" icon={<TrashIcon16 />} onClick={deleteTask}>
                  Delete task
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
      {nestedLists.length > 0 && (
        <div className="[&_:is(ul,ol)]:!m-0 pl-7">
          {nestedLists.map((list, index) => (
            <React.Fragment key={index}>{list}</React.Fragment>
          ))}
        </div>
      )}
    </li>
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
        <Markdown hideFrontmatter emptyText="Empty note">
          {note.content}
        </Markdown>
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
