import { z } from "zod"

export type NoteId = string

export type Note = {
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

  // Derived from links
  backlinks: NoteId[]
}

export type GitHubRepository = {
  owner: string
  name: string
}

export type GitHubUser = {
  token: string
  username: string
}

export const templateInputSchema = z.object({
  type: z.literal("string"),
  required: z.boolean().optional(),
  default: z.string().optional(),
  description: z.string().optional(),
})

export const templateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputs: z.record(templateInputSchema).optional(),
  body: z.string(),
})

export type TemplateInput = z.infer<typeof templateInputSchema>

export type Template = z.infer<typeof templateSchema>
