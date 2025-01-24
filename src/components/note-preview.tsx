import { useMemo } from "react"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { formatDateDistance, formatWeekDistance } from "../utils/date"
import { useLinkHighlight } from "./link-highlight-provider"
import { Markdown } from "./markdown"

const NUM_VISIBLE_TAGS = 4

export function NotePreview({ note, className }: { note: Note; className?: string }) {
  const highlightedHrefs = useLinkHighlight()

  const frontmatterTags = useMemo(() => {
    const tagsArray =
      Array.isArray(note.frontmatter?.tags) &&
      note.frontmatter.tags.every((tag) => typeof tag === "string")
        ? (note.frontmatter.tags as string[])
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
  }, [note.frontmatter?.tags])

  return (
    <div
      {...{ inert: "" }}
      className={cx(
        "flex aspect-[5/3] w-full flex-col gap-1.5 overflow-hidden p-3 [contain:layout_paint]",
        className,
      )}
    >
      {(note.type === "daily" || note.type === "weekly") && !note.title ? (
        <div className={cx("mb-1 flex items-baseline gap-2.5 font-content")}>
          <span className="truncate font-bold">{note.displayName}</span>
          <span className="truncate text-sm italic text-text-secondary">
            {note.type === "daily" ? formatDateDistance(note.id) : formatWeekDistance(note.id)}
          </span>
        </div>
      ) : null}
      <div className="flex-grow overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] [&_*::-webkit-scrollbar]:hidden">
        <div className="w-[125%] origin-top-left scale-[80%]">
          <Markdown hideFrontmatter>{note.content}</Markdown>
        </div>
      </div>
      <div className="flex flex-wrap pr-10 font-content [column-gap:8px] [row-gap:4px] empty:hidden coarse:pr-12">
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
    </div>
  )
}
