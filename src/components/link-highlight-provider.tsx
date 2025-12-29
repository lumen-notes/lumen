import React, { useContext, useMemo } from "react"

type LinkHighlightProviderProps = {
  href?: string | string[]
  tags?: string[]
  children?: React.ReactNode
}

export const LinkHighlightContext = React.createContext<string[]>([])

const highlightStyles = `
  color: var(--color-text-highlight);
  background-color: var(--color-bg-highlight);
  text-decoration-color: currentColor;
`

export function LinkHighlightProvider({ href, tags, children }: LinkHighlightProviderProps) {
  const inheritedHrefs = useLinkHighlight()

  // Scope styles using a unique ID
  const id = useMemo(() => `id-${Math.random().toString(36).substring(2, 15)}`, [])
  const hrefs = useMemo(() => (Array.isArray(href) ? href : href ? [href] : []), [href])

  const contextValue = useMemo(() => [...inheritedHrefs, ...hrefs], [inheritedHrefs, hrefs])

  // Generate CSS selectors for tag links
  // Tags use query params like /?query=tag:foo&view=grid
  const tagSelectors = useMemo(() => {
    if (!tags || tags.length === 0) return ""
    return tags
      .flatMap((tag) => {
        // For nested tags like "foo/bar", highlight both "foo" and "foo/bar"
        const segments = tag.split("/")
        return segments.map((_, i) => {
          const tagPath = segments.slice(0, i + 1).join("/")
          // Match href containing the tag query param (URL encoded : is %3A)
          return `#${id} a[href*="query=tag%3A${encodeURIComponent(tagPath)}"] { ${highlightStyles} }`
        })
      })
      .join("\n")
  }, [id, tags])

  return (
    <div id={id}>
      <style>
        {hrefs.map(
          (href) =>
            `#${id} a[href="${href}"], #${id} a[href^="${href}?"] { ${highlightStyles} }`,
        )}
        {tagSelectors}
      </style>
      <LinkHighlightContext.Provider value={contextValue}>{children}</LinkHighlightContext.Provider>
    </div>
  )
}

export function useLinkHighlight() {
  return useContext(LinkHighlightContext)
}
