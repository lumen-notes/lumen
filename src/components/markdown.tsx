import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"
import remarkGfm from "remark-gfm"
import { remarkDateLink } from "../remark-plugins/date-link"
import { remarkNoteLink } from "../remark-plugins/note-link"
import { remarkTagLink } from "../remark-plugins/tag-link"
import { formatDate } from "../utils/format-date"

type MarkdownProps = {
  children: string
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      className="markdown"
      remarkPlugins={[remarkGfm, remarkNoteLink, remarkTagLink, remarkDateLink]}
      remarkRehypeOptions={{
        handlers: {
          // TODO: Improve type-safety of `node`
          noteLink(h, node) {
            return h(node, "noteLink", {
              id: node.data.id,
              text: node.data.text,
            })
          },
          tagLink(h, node) {
            return h(node, "tagLink", {
              name: node.data.name,
            })
          },
          dateLink(h, node) {
            return h(node, "dateLink", {
              date: node.data.date,
            })
          },
        },
      }}
      components={{
        // @ts-ignore I'm not sure how to extend the list of accepted component keys
        noteLink({ id, text }) {
          return <Link to={`/${id}`}>{text}</Link>
        },
        // @ts-ignore
        tagLink({ name }) {
          return (
            <Link className="text-text-muted" to={`/tags/${name}`}>
              #{name}
            </Link>
          )
        },
        // @ts-ignore
        dateLink({ date }) {
          return <Link to={`/dates/${date}`}>{formatDate(date)}</Link>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
