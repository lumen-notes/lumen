import Prism from "prismjs"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-diff"
import "prismjs/components/prism-json"
import "prismjs/components/prism-jsx"
import "prismjs/components/prism-python"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-tsx"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-yaml"

type SyntaxHighlighterProps = {
  language?: string
  children: React.ReactNode
}

export function SyntaxHighlighter({ language, children }: SyntaxHighlighterProps) {
  if (!language || !Prism.languages[language]) {
    return <code>{children}</code>
  }

  const html = Prism.highlight(String(children), Prism.languages[language], language)
  return <code className="prism" dangerouslySetInnerHTML={{ __html: html }} />
}

const EJS_REGEX = /<%([\s\S]+?)%>/g

export function TemplateSyntaxHighlighter({ children }: { children: string }) {
  const html = children.replace(EJS_REGEX, (_, code) => {
    const highlighted = Prism.highlight(code, Prism.languages.javascript, "javascript")
    return `<span class="token punctuation">&lt;%</span><span>${highlighted}</span><span class="token punctuation">%&gt;</span>`
  })

  return <code className="prism" dangerouslySetInnerHTML={{ __html: html }} />
}
