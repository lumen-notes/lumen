import { Link } from "@tanstack/react-router"
import React from "react"
import { cx } from "../utils/cx"

type TagLinkProps = {
  name: string
  className?: string
}

export function TagLink({ name, className }: TagLinkProps) {
  return (
    <span className={cx("text-text-secondary", className)}>
      #
      {name.split("/").map((part, i) => {
        return (
          <React.Fragment key={i}>
            {i > 0 && <span>/</span>}
            <Link
              className="link"
              to="/"
              search={{
                query: `tag:${name
                  .split("/")
                  .slice(0, i + 1)
                  .join("/")}`,
                view: "grid",
              }}
            >
              {part}
            </Link>
          </React.Fragment>
        )
      })}
    </span>
  )
}
