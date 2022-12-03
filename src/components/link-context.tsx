import React from "react"
import { Link } from "react-router-dom"

export const LinkContext = React.createContext(Link)

export function useLink() {
  return React.useContext(LinkContext)
}
