import { useNetworkState } from "react-use"
import { Note, templateSchema } from "../types"
import { cx } from "../utils/cx"
import { GitHubAvatar } from "./github-avatar"
import { NoteIcon16, NoteTemplateIcon16 } from "./icons"
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
