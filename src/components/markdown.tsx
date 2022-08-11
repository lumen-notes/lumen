import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type MarkdownProps = {
  children: string
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown className="markdown" remarkPlugins={[remarkGfm]}>
      {children}
    </ReactMarkdown>
  )
}
