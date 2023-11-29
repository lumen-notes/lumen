import React from "react"
import { LinkProps, Link as RouterLink } from "react-router-dom"

export type LinkClickHandler = (
  props: LinkProps,
  event?: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
) => void

export const LinkContext = React.createContext<LinkClickHandler | null>(null)

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const handleClick = React.useContext(LinkContext)

  return <RouterLink ref={ref} onClick={(event) => handleClick?.(props, event)} {...props} />
})
