export type NoteId = string

export type Note = {
  title: string
  body: string
  tags: string[]
  dates: string[]
  backlinks: NoteId[]
  frontmatter: Record<string, unknown>
}
