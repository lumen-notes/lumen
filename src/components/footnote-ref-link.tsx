import React from "react"
import { cx } from "../utils/cx"
import { getFootnoteContent } from "../utils/footnote"
import { HoverCard } from "./hover-card"
import { MarkdownContext, MarkdownContent } from "./markdown"

export function FootnoteRefLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children?: React.ReactNode
}) {
  const { markdown } = React.useContext(MarkdownContext)
  const targetId = href.slice(1)
  const footnoteId = targetId.replace("user-content-fn-", "")
  const content = React.useMemo(
    () => getFootnoteContent(markdown, footnoteId),
    [markdown, footnoteId],
  )

  if (!content) {
    return (
      <a href={href} className={cx("text-text-secondary px-0.5", className)}>
        {children}
      </a>
    )
  }

  return (
    <HoverCard.Trigger
      render={
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        <a href={href} className={cx("text-text-secondary px-0.5", className)} />
      }
      payload={{
        content: <MarkdownContent>{content}</MarkdownContent>,
        popupClassName: "max-w-80 rounded-lg py-2.5 px-4",
      }}
    >
      {children}
    </HoverCard.Trigger>
  )
}
