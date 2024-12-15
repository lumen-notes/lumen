export function togglePin(content: string): string {
  // Define a regular expression to match the frontmatter block
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/

  // Check if the content contains a frontmatter block
  if (frontmatterRegex.test(content)) {
    return content
      .replace(frontmatterRegex, (frontmatterBlock, frontmatterContent) => {
        const frontmatterLines = frontmatterContent.split("\n")
        const pinnedIndex = frontmatterLines.findIndex((line: string) => line.startsWith("pinned:"))

        if (pinnedIndex !== -1) {
          const pinnedValue = frontmatterLines[pinnedIndex].split(":")[1].trim()

          if (pinnedValue === "true") {
            // If pinned value is true, remove it
            frontmatterLines.splice(pinnedIndex, 1)
          } else {
            // If pinned value is false, set it to true
            frontmatterLines[pinnedIndex] = "pinned: true"
          }
        } else {
          // If there's no pinned key, add it and set it to true
          frontmatterLines.push("pinned: true")
        }

        // If there's no frontmatter content, remove the frontmatter block
        if (frontmatterLines.length === 0) {
          return ""
        }

        return `---\n${frontmatterLines.join("\n")}\n---`
      })
      .trimStart()
  } else {
    // If there's no frontmatter, add it with pinned: true
    return `---\npinned: true\n---\n\n${content}`
  }
}
