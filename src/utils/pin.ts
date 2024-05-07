export function togglePin(content: string): string {
  // Define a regular expression to match the frontmatter block
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/

  // Check if the content contains a frontmatter block
  if (frontmatterRegex.test(content)) {
    return content.replace(frontmatterRegex, (frontmatterBlock, frontmatterContent) => {
      const frontmatterLines = frontmatterContent.split("\n")
      const pinnedIndex = frontmatterLines.findIndex((line: string) =>
        line.startsWith("pinned:"),
      )
      if (pinnedIndex !== -1) {
        // Note is currently pinned, so unpin it
        const pinnedValue = frontmatterLines[pinnedIndex].split(":")[1].trim()
        if (pinnedValue === "true") {
          frontmatterLines.splice(pinnedIndex, 1)
        } else {
          // If pinned value is not true, replace it with true
          frontmatterLines[pinnedIndex] = "pinned: true"
        }
      } else {
        // Note is currently unpinned, so pin it
        frontmatterLines.push("pinned: true")
      }
      return `---\n${frontmatterLines.join("\n")}\n---`
    })
  } else {
    // If there's no frontmatter, add it with pinned: true
    return `---\npinned: true\n---\n\n${content}`
  }
}
