import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { remarkNoteLink } from "../remark-plugins/note-link"

type MarkdownProps = {
  children: string
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      className="markdown"
      remarkPlugins={[remarkGfm, remarkNoteLink]}
      remarkRehypeOptions={{
        handlers: {
          // TODO: Improve type-safety of `node`
          noteLink(h, node) {
            return h(node, "noteLink", {
              id: node.data.id,
              text: node.data.text,
            })
          },
        },
      }}
      components={{
        // @ts-ignore I'm not sure how to extend the list of accepted component keys
        noteLink({ id, text }) {
          return <a href={`/${id}`}>{text}</a>
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
