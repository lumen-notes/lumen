import { useMemo } from "react"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { removeParentTags } from "../utils/remove-parent-tags"
import { useLinkHighlight } from "./link-highlight-provider"
import { Markdown } from "./markdown"

const NUM_VISIBLE_TAGS = 4

export function NotePreview({ note }: { note: Note }) {
  const highlightedHrefs = useLinkHighlight()

  const filteredTags = useMemo(() => {
    return removeParentTags(note.tags)
  }, [note.tags])

  return (
    <div
      {...{ inert: "" }}
      className="grid aspect-[5/3] w-full grid-rows-[1fr_auto] gap-1.5 overflow-hidden p-3 [contain:layout_paint]"
    >
      <div className="overflow-hidden [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] [&_*::-webkit-scrollbar]:hidden">
        <div className="w-[125%] origin-top-left scale-[80%]">
          <Markdown hideFrontmatter>{note.content}</Markdown>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 pr-10 coarse:pr-12">
        {filteredTags.slice(0, NUM_VISIBLE_TAGS).map((tag) => (
          <div
            key={tag}
            className={cx(
              "flex h-5 items-center rounded-full px-1.5 text-sm",
              highlightedHrefs.some((href) => `/tags/${tag}`.startsWith(href))
                ? "bg-bg-highlight text-text-highlight"
                : "bg-bg-secondary text-text-secondary",
            )}
          >
            {tag}
          </div>
        ))}
        {filteredTags.length > NUM_VISIBLE_TAGS ? (
          <div className="flex h-5 items-center rounded-full bg-bg-secondary px-1.5 text-sm text-text-secondary">
            +{filteredTags.length - NUM_VISIBLE_TAGS}
          </div>
        ) : null}
      </div>
    </div>
  )
}
