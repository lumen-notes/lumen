import React from "react"
import { useNetworkState } from "react-use"
import { Note } from "../schema"
import { cx } from "../utils/cx"
import { getLeadingEmoji } from "../utils/emoji"
import { GitHubAvatar } from "./github-avatar"
import { CalendarDateIcon16, CalendarIcon16, NoteIcon16, NoteTemplateIcon16 } from "./icons"
import { WebsiteFavicon } from "./website-favicon"

type NoteFaviconProps = React.ComponentPropsWithoutRef<"span"> & {
  note: Note
  defaultFavicon?: React.ReactNode
}

const _defaultFavicon = <NoteIcon16 data-testid="favicon-default" />

export const NoteFavicon = React.memo(
  ({ note, className, defaultFavicon = _defaultFavicon, ...props }: NoteFaviconProps) => {
    const { online } = useNetworkState()

    let icon = defaultFavicon

    // Emoji
    const leadingEmoji = getLeadingEmoji(note.title)
    if (leadingEmoji) {
      icon = (
        <svg className="h-full w-full overflow-visible" viewBox="0 0 16 16">
          <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={14}>
            {leadingEmoji}
          </text>
        </svg>
      )
    }

    // Daily note
    if (note.type === "daily") {
      icon = (
        <CalendarDateIcon16
          data-testid="favicon-daily"
          className="h-full w-full"
          date={new Date(note.id).getUTCDate()}
        />
      )
    }

    // Weekly note
    if (note.type === "weekly") {
      icon = <CalendarIcon16 className="h-full w-full" data-testid="favicon-weekly" />
    }

    // GitHub
    if (typeof note.frontmatter.github === "string" && online) {
      icon = (
        <GitHubAvatar
          data-testid="favicon-github"
          className="h-full w-full"
          login={note.frontmatter.github}
          size={16}
        />
      )
    }

    // URL
    if (note.url && online) {
      icon = <WebsiteFavicon className="h-full w-full" data-testid="favicon-url" url={note.url} />
    }

    // Book
    if (note.frontmatter.isbn && online) {
      icon = (
        <div
          data-testid="favicon-isbn"
          className="focus-ring inline-block aspect-[3/4] h-full rounded-[2px] bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary"
          style={{
            backgroundImage: `url(https://covers.openlibrary.org/b/isbn/${note.frontmatter.isbn}-S.jpg)`,
          }}
          aria-hidden
        />
      )
    }

    // Template
    if (note.type === "template") {
      icon = <NoteTemplateIcon16 className="h-full w-full" data-testid="favicon-template" />
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
