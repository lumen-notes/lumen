export type NoteId = string

export type Note = {
  title: string
  body: string
  tags: string[]
  dates: string[]
  links: NoteId[]
  backlinks: NoteId[]
  frontmatter: Record<string, unknown>
}
