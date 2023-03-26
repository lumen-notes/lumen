export type NoteId = string

export type Note = {
  // Raw body of the markdown file
  rawBody: string

  // Parsed from the raw body
  frontmatter: Record<string, unknown>
  title: string
  dates: string[]
  links: NoteId[]
  tags: string[]

  // Derived from links
  backlinks: NoteId[]
}
