import { Note, templateSchema } from "../types"
import { NoteIcon16, NoteTemplateIcon16 } from "./icons"

export function NoteFavicon({ note }: { note: Note }) {
  let icon = <NoteIcon16 />

  // Template
  const { success: isTemplate } = templateSchema
    .omit({ body: true })
    .safeParse(note.frontmatter.template)

  if (isTemplate) {
    icon = <NoteTemplateIcon16 />
  }

  // GitHub avatar
  if (typeof note.frontmatter.github === "string") {
    icon = (
      <div
        aria-hidden
        className="inline-block h-4 w-4 rounded-full bg-bg-secondary bg-cover ring-1 ring-inset ring-border-secondary"
        style={{
          backgroundImage: `url(https://github.com/${note.frontmatter.github}.png?size=32)`,
        }}
      />
    )
  }

  // Note has a URL
  if (note.url) {
    icon = (
      <div
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
  if (typeof note.frontmatter.isbn === "string") {
    icon = (
      <div
        className="focus-ring inline-block aspect-[3/4] h-4 rounded-[2px] bg-bg-secondary bg-cover bg-center shadow-sm ring-1 ring-inset ring-border-secondary"
        style={{
          backgroundImage: `url(https://covers.openlibrary.org/b/isbn/${note.frontmatter.isbn}-S.jpg)`,
        }}
        aria-hidden
      />
    )
  }

  return <span className="inline-grid h-4 w-4 place-items-center text-text-secondary">{icon}</span>
}
