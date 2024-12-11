import React from "react"
import { useNetworkState } from "react-use"
import { templateSchema } from "../schema"
import { cx } from "../utils/cx"
import { isValidDateString, isValidWeekString } from "../utils/date"
import { getLeadingEmoji } from "../utils/emoji"
import { parseNote } from "../utils/parse-note"
import { GitHubAvatar } from "./github-avatar"
import { CalendarDateIcon16, CalendarIcon16, NoteIcon16, NoteTemplateIcon16 } from "./icons"
import { WebsiteFavicon } from "./website-favicon"

type NoteFaviconProps = React.ComponentPropsWithoutRef<"span"> & {
  noteId: string
  content: string
  defaultFavicon?: React.ReactNode
}

const _defaultFavicon = <NoteIcon16 data-testid="favicon-default" />

export const NoteFavicon = React.memo(
  ({
    noteId,
    content,
    className,
    defaultFavicon = _defaultFavicon,
    ...props
  }: NoteFaviconProps) => {
    const { online } = useNetworkState()
    const { frontmatter, title, url } = React.useMemo(() => parseNote(content), [content])

    let icon = defaultFavicon

    // Emoji
    const leadingEmoji = getLeadingEmoji(title)
    if (leadingEmoji) {
      icon = (
        <svg className="h-4 w-4 overflow-visible" viewBox="0 0 16 16">
          <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={14}>
            {leadingEmoji}
          </text>
        </svg>
      )
    }

    // Daily note
    if (isValidDateString(noteId)) {
      icon = <CalendarDateIcon16 data-testid="favicon-daily" date={new Date(noteId).getUTCDate()} />
    }

    // Weekly note
    if (isValidWeekString(noteId)) {
      icon = <CalendarIcon16 data-testid="favicon-weekly" />
    }

    // GitHub
    if (typeof frontmatter.github === "string" && online) {
      icon = <GitHubAvatar data-testid="favicon-github" login={frontmatter.github} size={16} />
    }

    // URL
    if (url && online) {
      icon = <WebsiteFavicon data-testid="favicon-url" url={url} />
    }

    // Book
    if (frontmatter.isbn && online) {
      icon = (
        <div
          data-testid="favicon-isbn"
          className="focus-ring inline-block aspect-[3/4] h-4 rounded-[2px] bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary"
          style={{
            backgroundImage: `url(https://covers.openlibrary.org/b/isbn/${frontmatter.isbn}-S.jpg)`,
          }}
          aria-hidden
        />
      )
    }

    // Template
    const { success: isTemplate } = templateSchema
      .omit({ body: true })
      .safeParse(frontmatter.template)

    if (isTemplate) {
      icon = <NoteTemplateIcon16 data-testid="favicon-template" />
    }

    if (!icon) {
      return null
    }

    return (
      <span
        className={cx("inline-grid h-4 w-4 place-items-center text-text-secondary", className)}
        {...props}
      >
        {icon}
      </span>
    )
  },
)
