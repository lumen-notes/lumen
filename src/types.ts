export type NoteId = string

export type Note = {
  // Raw body of the markdown file
  rawBody: string

  // Parsed from the raw body
  frontmatter: Record<string, unknown>
  title: string
  // If the title contains a link (e.g. `# [title](url)`), this will be the url
  url: string | null
  dates: string[]
  links: NoteId[]
  tags: string[]
  queries: string[]

  // Derived from links
  backlinks: NoteId[]
}

export type GitHubRepository = {
  owner: string
  name: string
}
