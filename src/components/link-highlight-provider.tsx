import React from "react"

type LinkHighlightProviderProps = {
  href: string | string[]
  children?: React.ReactNode
}

export function LinkHighlightProvider({ href, children }: LinkHighlightProviderProps) {
  // Scope styles using a unique ID
  const id = React.useMemo(() => `id-${Math.random().toString(36).substring(2, 15)}`, [])
  const hrefs = Array.isArray(href) ? href : [href]
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
      {children}
    </div>
  )
}
