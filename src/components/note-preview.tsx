import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { defaultFontAtom, githubRepoAtom } from "../global-state"
import { Note, fontSchema } from "../schema"
import { cx } from "../utils/cx"
import { formatDateDistance, formatWeekDistance } from "../utils/date"
import { parseFrontmatter } from "../utils/frontmatter"
import { getNoteDraft } from "../utils/note-draft"
import { DraftIndicator } from "./draft-indicator"
import { GlobeIcon16 } from "./icons"
import { useLinkHighlight } from "./link-highlight-provider"
import { Markdown } from "./markdown"

const NUM_VISIBLE_TAGS = 4

type NotePreviewProps = {
  note: Note
  className?: string
  hideProperties?: boolean
}

export function NotePreview({ note, className, hideProperties }: NotePreviewProps) {
  const highlightedHrefs = useLinkHighlight()
  const defaultFont = useAtomValue(defaultFontAtom)
  const githubRepo = useAtomValue(githubRepoAtom)

  // Prefer a local draft if it exists (unsaved changes)
  const { resolvedContent, isDraft } = useMemo(() => {
    const draft = getNoteDraft({ githubRepo, noteId: note.id })
    if (draft !== null && draft !== note.content) {
      return { resolvedContent: draft, isDraft: true }
    }
    return { resolvedContent: note.content, isDraft: false }
  }, [githubRepo, note.id, note.content])

  // Parse frontmatter from the resolved content so frontmatter-derived values reflect drafts
  const resolvedFrontmatter = useMemo(() => {
    return parseFrontmatter(resolvedContent).frontmatter
  }, [resolvedContent])

  // Resolve note font (frontmatter font or default)
  const resolvedFont = useMemo(() => {
    const frontmatterFont = resolvedFrontmatter?.font as unknown
    const parseResult = fontSchema.safeParse(frontmatterFont)
    const parsedFont = parseResult.success ? parseResult.data : null
    return parsedFont || defaultFont
  }, [resolvedFrontmatter?.font, defaultFont])

  const frontmatterTags = useMemo(() => {
    const tagsArray =
      Array.isArray(resolvedFrontmatter?.tags) &&
      (resolvedFrontmatter.tags as unknown[]).every((tag) => typeof tag === "string")
        ? (resolvedFrontmatter.tags as string[])
        : []

    const frontmatterTags = new Set<string>()

    // Expand nested tags (e.g. "foo/bar/baz" => "foo", "foo/bar", "foo/bar/baz")
    tagsArray.forEach((tag) =>
      tag.split("/").forEach((_, index) => {
        frontmatterTags.add(
          tag
            .split("/")
            .slice(0, index + 1)
            .join("/"),
        )
      }),
    )

    return Array.from(frontmatterTags)
  }, [resolvedFrontmatter?.tags])

  return (
    <div
      {...{ inert: "" }}
      className={cx(
        "flex aspect-[5/3] w-full flex-col gap-1.5 overflow-hidden p-4 [contain:layout_paint]",
        className,
      )}
      style={
        {
          "--font-family-content": `var(--font-family-${resolvedFont})`,
          "--font-family-mono": `var(--font-family-${resolvedFont}-mono)`,
        } as React.CSSProperties
      }
    >
      {(note.type === "daily" || note.type === "weekly") && !note.title ? (
        <div className={cx("mb-1 flex items-baseline gap-2.5 font-content")}>
          <span className="truncate font-bold text-[calc(var(--font-size-xl)*0.66)]">
            {note.displayName}
          </span>
          <span className="truncate text-sm italic text-text-secondary">
            {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
          </span>
        </div>
      ) : null}
      <div className="flex-grow overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] [&_*::-webkit-scrollbar]:hidden">
        <div className="w-[152%] origin-top-left scale-[66%]">
          <Markdown hideFrontmatter>{resolvedContent}</Markdown>
        </div>
      </div>
      {!hideProperties ? (
        <div className="flex flex-wrap pr-10 font-content [column-gap:8px] [row-gap:4px] empty:hidden coarse:pr-12">
          {resolvedFrontmatter?.gist_id ? (
            <div className="flex items-center self-stretch">
              <GlobeIcon16 className="text-border-focus" />
            </div>
          ) : null}
          {isDraft ? <DraftIndicator /> : null}
          {frontmatterTags.slice(0, NUM_VISIBLE_TAGS).map((tag) => (
            <div
              key={tag}
              className={cx(
                "-mx-[3px] flex items-center rounded-sm px-[3px] text-sm",
                highlightedHrefs.includes(`/tags/${tag}`)
                  ? "bg-bg-highlight text-text-highlight"
                  : "text-text-secondary",
              )}
            >
              #{tag}
            </div>
          ))}
          {frontmatterTags.length > NUM_VISIBLE_TAGS ? (
            <div className="flex  items-center rounded-full text-sm text-text-secondary">
              +{frontmatterTags.length - NUM_VISIBLE_TAGS}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
