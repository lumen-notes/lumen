import { z } from "zod"

export type NoteId = string

export type Note = {
  /**  Markdown file name without the extension */
  id: NoteId

  /**  Content of the markdown file */
  content: string

  // Parsed from the content
  frontmatter: Record<string, unknown>
  title: string
  /** If the title contains a link (e.g. `# [title](url)`), this will be the url */
  url: string | null
  links: NoteId[]
  dates: string[]
  tags: string[]

  // Derived from links
  backlinks: NoteId[]
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
