import { z } from "zod"

export type NoteId = string

export type Note = {
  /** The markdown file path without the extension (e.g. `foo/bar.md` → `foo/bar`) */
  id: NoteId
  /** The content of the markdown file */
  content: string

  // ↓ Parsed from the content

  /** Depending on the content, either the title, id, or template name */
  displayName: string
  /** The frontmatter of the markdown file */
  frontmatter: Record<string, unknown>
  /** If the markdown file contains an h1 (e.g. `# title`), we use that as the title */
  title: string
  /** If the title contains a link (e.g. `# [title](url)`), we use that as the url */
  url: string | null
  /** The ids of all notes that are linked to from this note */
  links: NoteId[]
  dates: string[]
  tags: string[]
  /** How many open tasks (`- [ ]`) the note has */
  openTasks: number

  // ↓ Derived from links

  /** The ids of all notes that link to this note */
  backlinks: NoteId[]
}

export type GitHubRepository = {
  owner: string
  name: string
}

export const githubUserSchema = z.object({
  token: z.string(),
  login: z.string(),
  name: z.string(),
  email: z.string(),
})

export type GitHubUser = z.infer<typeof githubUserSchema>

export const templateInputSchema = z.object({
  type: z.literal("string"),
  required: z.boolean().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
})

export type TemplateInput = z.infer<typeof templateInputSchema>

export const templateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputs: z.record(templateInputSchema).optional(),
  body: z.string(),
})

export type Template = z.infer<typeof templateSchema>
