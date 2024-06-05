import { useNetworkState } from "react-use"
import { Note, templateSchema } from "../schema"
import { cx } from "../utils/cx"
import { isValidDateString, isValidWeekString } from "../utils/date"
import { getLeadingEmoji } from "../utils/emoji"
import { GitHubAvatar } from "./github-avatar"
import { CalendarIcon16, NoteIcon16, NoteTemplateIcon16 } from "./icons"
import { WebsiteFavicon } from "./website-favicon"

type NoteFaviconProps = React.ComponentPropsWithoutRef<"span"> & {
  note: Note
  defaultFavicon?: React.ReactNode
}

export function NoteFavicon({
  note,
  className,
  defaultFavicon = <NoteIcon16 data-testid="favicon-default" />,
  ...props
}: NoteFaviconProps) {
  const { online } = useNetworkState()

  let icon = defaultFavicon

  // Emoji
  const leadingEmoji = getLeadingEmoji(note.title)
  if (leadingEmoji) {
    icon = (
      <svg className="h-4 w-4" viewBox="0 0 16 16">
        <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={16}>
          {leadingEmoji}
        </text>
      </svg>
    )
  }

  // Daily note
  if (isValidDateString(note.id)) {
    icon = (
      <CalendarIcon16 data-testid="favicon-daily">{new Date(note.id).getUTCDate()}</CalendarIcon16>
    )
  }

  // Weekly note
  if (isValidWeekString(note.id)) {
    icon = <CalendarIcon16 data-testid="favicon-weekly">W</CalendarIcon16>
  }

  // GitHub
  if (typeof note.frontmatter.github === "string" && online) {
    icon = <GitHubAvatar data-testid="favicon-github" login={note.frontmatter.github} size={16} />
  }

  // URL
  if (note.url && online) {
    icon = <WebsiteFavicon data-testid="favicon-url" url={note.url} />
  }

  // Book
  if (note.frontmatter.isbn && online) {
    icon = (
      <div
        data-testid="favicon-isbn"
        className="focus-ring inline-block aspect-[3/4] h-4 rounded-[2px] bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary"
        style={{
          backgroundImage: `url(https://covers.openlibrary.org/b/isbn/${note.frontmatter.isbn}-S.jpg)`,
        }}
        aria-hidden
      />
    )
  }

  // Template
  const { success: isTemplate } = templateSchema
    .omit({ body: true })
    .safeParse(note.frontmatter.template)

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
}
