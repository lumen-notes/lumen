import { Point } from "unist"
import { z } from "zod"

export type NoteId = string

export type Note = {
  // Markdown file name
  id: NoteId

  // Raw body of the markdown file
  rawBody: string

  // Parsed from the raw body
  frontmatter: Record<string, unknown>
  title: string
  url: string | null // If the title contains a link (e.g. `# [title](url)`), this will be the url
  dates: string[]
  links: NoteId[]
  tags: string[]
  queries: string[]
  tasks: Task[]

  // Derived from links
  backlinks: NoteId[]
}

export type Task = {
  noteId: NoteId
  start: Point
  rawBody: string
  completed: boolean
  title: string
  priority: 1 | 2 | 3 | 4
  dates: string[]
  links: NoteId[]
  tags: string[]
}

export type GitHubRepository = {
  owner: string
  name: string
}

export const githubUserSchema = z.object({
  token: z.string(),
  username: z.string(),
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
