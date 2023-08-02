import React from "react"
import { useLink } from "./link-context"

type TagLinkProps = {
  name: string
}

export function TagLink({ name }: TagLinkProps) {
  const Link = useLink()
  return (
    <span className="text-text-secondary">
      #
      {name.split("/").map((part, i) => {
        return (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            <Link
              target="_blank"
              className="link text-text-secondary"
              to={`/tags/${name
                .split("/")
                .slice(0, i + 1)
                .join("/")}`}
            >
              {part}
            </Link>
          </React.Fragment>
        )
      })}
    </span>
  )
}
