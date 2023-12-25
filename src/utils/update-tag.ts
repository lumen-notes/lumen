/** Rename or delete a tag in a markdown file */
export function updateTag({
  fileContent,
  oldName,
  newName,
}: {
  fileContent: string
  oldName: string
  newName: string | null // null means delete
}): string {
  // Replace the old tag name with the new one in the file content
  let updatedContent = fileContent.replace(
    new RegExp(`#${oldName}\\b`, "g"),
    newName ? `#${newName}` : "",
  )

  // Replace the old tag name with the new one in the frontmatter
  const frontmatterTagsRegex = /tags: \[(.*?)\]/g
  const matches = frontmatterTagsRegex.exec(fileContent)
  if (matches && matches[1]) {
    const tags = matches[1].split(",").map((tag) => tag.trim())
    const updatedTags = tags
      .map((tag) => (tag === oldName ? newName : tag))
      .filter(Boolean)
      .join(", ")
    updatedContent = updatedContent.replace(frontmatterTagsRegex, `tags: [${updatedTags}]`)
  }

  return updatedContent
}
