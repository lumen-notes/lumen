import React, { useContext, useMemo } from "react"

type LinkHighlightProviderProps = {
  href: string | string[]
  children?: React.ReactNode
}

export const LinkHighlightContext = React.createContext<string[]>([])

export function LinkHighlightProvider({ href, children }: LinkHighlightProviderProps) {
  const inheritedHrefs = useLinkHighlight()

  // Scope styles using a unique ID
  const id = useMemo(() => `id-${Math.random().toString(36).substring(2, 15)}`, [])
  const hrefs = useMemo(() => (Array.isArray(href) ? href : [href]), [href])

  const contextValue = useMemo(() => [...inheritedHrefs, ...hrefs], [inheritedHrefs, hrefs])

  return (
    <div id={id}>
      <style>
        {hrefs.map(
          (href) =>
            `#${id} a[href="${href}"], #${id} a[href^="${href}?"] {
              color: var(--color-text-highlight);
              background-color: var(--color-bg-highlight);
              text-decoration-color: currentColor;
            }`,
        )}
      </style>
      <LinkHighlightContext.Provider value={contextValue}>{children}</LinkHighlightContext.Provider>
    </div>
  )
}

export function useLinkHighlight() {
  return useContext(LinkHighlightContext)
}
