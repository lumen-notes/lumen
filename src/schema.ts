import { z } from "zod"

export type NoteId = string

export type NoteType = "note" | "daily" | "weekly" | "template"

export type Task = {
  completed: boolean
  text: string
}

export type Note = {
  /** The markdown file path without the extension (e.g. `foo/bar.md` → `foo/bar`) */
  id: NoteId
  /** The content of the markdown file */
  content: string

  // ↓ Parsed from the content

  /** The type of the note */
  type: NoteType
  /** Depending on the type, either the title, template name, or the date */
  displayName: string
  /** The frontmatter of the markdown file */
  frontmatter: Record<string, unknown>
  /** If the markdown file contains an h1 (e.g. `# title`), we use that as the title */
  title: string
  /** If the title contains a link (e.g. `# [title](url)`), we use that as the url */
  url: string | null
  /** The alias to use when linking to this note, from alias frontmatter */
  alias: string | null
  /** If the note is pinned */
  pinned: boolean
  /** The ids of all notes that are linked to from this note */
  links: NoteId[]
  dates: string[]
  tags: string[]
  /** The tasks in the note (e.g. `- [ ] Do laundry` → `{ completed: false, text: "Do laundry" }`) */
  tasks: Task[]

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

export const fontSchema = z.enum(["sans", "serif", "handwriting"])

export type Font = z.infer<typeof fontSchema>
