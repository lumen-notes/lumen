// Example: #foo #foo/bar -> #foo/bar
export function removeParentTags(tags: string[]) {
  return tags.filter((tag) => !tags.some((t) => t.startsWith(tag) && t !== tag))
}
