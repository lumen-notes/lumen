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
import { cx } from "../utils/cx"

export function Code({ className, children }: React.ComponentPropsWithoutRef<"code">) {
  const language = className?.replace(/language-/, "") || ""

  // Apply syntax highlighting
  if (language && Prism.languages[language]) {
    const html = Prism.highlight(String(children), Prism.languages[language], language)
    return <code className={cx("prism", className)} dangerouslySetInnerHTML={{ __html: html }} />
  }

  return <code className={className}>{children}</code>
}
