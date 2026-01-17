import { useAtomValue } from "jotai"
import { useMemo } from "react"
import { defaultFontAtom, githubRepoAtom } from "../global-state"
import { Note, fontSchema } from "../schema"
import { cx } from "../utils/cx"
import { formatDateDistance, formatWeekDistance } from "../utils/date"
import { parseFrontmatter } from "../utils/frontmatter"
import { getNoteDraft } from "../utils/note-draft"
import { DotIcon8, GlobeIcon12, TagIcon12 } from "./icons"
import { ProgressRing } from "./progress-ring"
import { Label } from "./label"
import { useLinkHighlight } from "./link-highlight-provider"
import { Markdown } from "./markdown"
import { pluralize } from "../utils/pluralize"

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
    return Array.isArray(resolvedFrontmatter?.tags) &&
      (resolvedFrontmatter.tags as unknown[]).every((tag) => typeof tag === "string")
      ? (resolvedFrontmatter.tags as string[])
      : []
  }, [resolvedFrontmatter?.tags])

  return (
    <div
      {...{ inert: "" }}
      className={cx(
        "flex aspect-[5/3] w-full flex-col gap-2 overflow-hidden p-4 [contain:layout_paint]",
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
        <div className="mb-1 shrink-0 flex flex-col gap-0.5">
          <span className="font-bold text-[calc(var(--font-size-xl)*0.66)] [text-box-trim:trim-start]">
            {note.displayName}
          </span>
          <span className="text-text-secondary">
            {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
          </span>
        </div>
      ) : null}
      <div className="grow overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] eink:[mask-image:none] [&_*::-webkit-scrollbar]:hidden">
        <div className="w-[152%] origin-top-left scale-[66%]">
          <Markdown hideFrontmatter emptyText="Empty note">
            {resolvedContent}
          </Markdown>
        </div>
      </div>
      {!hideProperties ? (
        <div className="flex flex-wrap gap-x-1.5 gap-y-2 pr-10 font-content empty:hidden coarse:pr-12">
          {isDraft ? (
            <Label icon={<DotIcon8 className="text-text-pending" />}>Unsaved</Label>
          ) : null}
          {resolvedFrontmatter?.gist_id ? (
            <Label icon={<GlobeIcon12 className="text-border-focus" />}>Published</Label>
          ) : null}
          {/*{note.tasks.length > 0 ? (
            <Label
              icon={
                <ProgressRing
                  size={14}
                  value={note.tasks.filter((t) => t.completed).length / note.tasks.length}
                  strokeWidth={2}
                />
              }
            >
              {note.tasks.filter((t) => t.completed).length}/{note.tasks.length}
            </Label>
          ) : null}*/}
          {note.backlinks.length > 0 ? (
            <Label>{pluralize(note.backlinks.length, "backlink")}</Label>
          ) : null}
          {frontmatterTags.slice(0, NUM_VISIBLE_TAGS).map((tag) => (
            <Label
              key={tag}
              icon={<TagIcon12 />}
              className={
                highlightedHrefs.some((href) => {
                  if (!href.startsWith("/tags/")) return false
                  const highlightedTag = href.slice(6)
                  return tag === highlightedTag || tag.startsWith(`${highlightedTag}/`)
                })
                  ? "bg-bg-highlight text-text-highlight"
                  : undefined
              }
            >
              {tag}
            </Label>
          ))}
          {frontmatterTags.length > NUM_VISIBLE_TAGS ? (
            <Label icon={<TagIcon12 />}>+{frontmatterTags.length - NUM_VISIBLE_TAGS}</Label>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
