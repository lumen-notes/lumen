export function getSampleMarkdownFiles() {
  return {
    [`README.md`]: `---
pinned: true
---

# Welcome to Lumen

Lumen is a free, open-source note-taking app for capturing and organizing your thoughts.

- Write notes in [[markdown-syntax|markdown]] files and store them in a GitHub repository of your choice. You stay in control of your data.
- Connect your notes with links and tags. Lumen makes it easy to explore  your knowledge graph and discover new connections.
- Access your notes from any device, even offline. Use Lumen's flexible [[search-syntax|search syntax]] to find exactly what you're looking for.

---

You're currently looking at Lumen in read-only mode. Feel free to explore!

When you're ready to start writing notes, sign in with GitHub and choose a repository.

`,
    "markdown-syntax.md": `---
tags: [docs]
pinned: true
---

# Markdown syntax

Lumen supports [GitHub Flavored Markdown](https://github.github.com/gfm) with the following syntax extensions.

## Wikilinks

Link to [[README|another note]] using its ID.

\`\`\`
[[<note-id>|<link-text>]]
\`\`\`

## Tags

Tags can be written inline (e.g. #docs) or in [[properties|frontmatter]] using the \`tags\` key.

\`\`\`
---
tags: [<tag-name>]
---
\`\`\`
`,
    "properties.md": `---
tags: [docs]
---

# Properties

You can add properties, in the form of key-value pairs ([YAML](https://yaml.org/)) enclosed within \`---\` delimiters, at the top of any note. We refer to this as your note's "frontmatter."

In the following example, we've added a property called \`isbn\`.

\`\`\`
---
isbn: 978-1542866507
---

# How to Take Smart Notes

...
\`\`\`

`,
    "search-syntax.md": `---
tags: [docs]
---

# Search syntax

Search your notes with Lumen's [GitHub-style](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) search syntax. Here's how it works:

- A search query can contain any combination of qualifiers, which are key-value pairs separated by spaces. For example, \`tag:log date:2021-07-11\` matches notes with the \`log\` tag AND the date \`2021-07-11\`.
- To exclude notes matching a qualifier, prefix the qualifier with a hyphen. For example, \`-tag:log\` matches notes that do not have the \`log\` tag.
- To include multiple values in a qualifier, separate the values with commas. For example, \`tag:article,book\` matches notes with either the \`article\` OR \`book\` tag.
- Qualifiers can also be used to filter notes based on numerical ranges. To do this, use one of the following operators before the qualifier value: \`>\`, \`<\`, \`>=\`, \`<=\`. For example, \`backlinks:>10\` matches notes with more than 10 backlinks; \`date:>=2021-01-01\` matches notes with a date on or after \`2021-01-01\`.
- Text outside of qualifiers is used to fuzzy search the note's title and body. For example, \`tag:recipe cookie\` matches notes with the \`recipe\` tag that also contain the word "cookie" in the title or body.
- To search for a value that contains spaces, wrap the value in quotes. For example, \`genre:"science fiction"\` matches notes with \`genre: science fiction\` in their [[properties|frontmatter]].

`,
  }
}
