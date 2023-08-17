import { Note, templateSchema } from "../types"
import { GitHubAvatar } from "./github-avatar"
import { NoteIcon16, NoteTemplateIcon16 } from "./icons"

export function NoteFavicon({ note }: { note: Note }) {
  let icon = <NoteIcon16 data-testid="favicon-default" />

  // GitHub
  if (typeof note.frontmatter.github === "string") {
    icon = (
      <GitHubAvatar data-testid="favicon-github" username={note.frontmatter.github} size={16} />
    )
  }

  // URL
  if (note.url) {
    icon = (
      <div
        data-testid="favicon-url"
        aria-hidden
        className="inline-block h-4 w-4 bg-contain bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
            note.url,
          )}&size=32)`,
        }}
      />
    )
  }

  // Book
  if (note.frontmatter.isbn) {
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

  return <span className="inline-grid h-4 w-4 place-items-center text-text-secondary">{icon}</span>
}
