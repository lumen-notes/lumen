import { EditorView } from "@codemirror/view"
import ejs from "ejs"
import React from "react"
import { Template } from "../types"
import { toDateString } from "../utils/date"

const InsertTemplateContext = React.createContext<(template: Template, view: EditorView) => void>(
  () => {},
)

function Provider({ children }: { children: React.ReactNode }) {
  // const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const insertTemplate = React.useCallback((template: Template, view: EditorView) => {
    let text = ejs.render(template.body, { date: `[[${toDateString(new Date())}]]` })

    // Find cursor position
    const cursorIndex = text.indexOf("{cursor}")

    // Remove "{cursor}" from template body
    text = text.replace("{cursor}", "")

    const from = view.state.selection.main.from
    const to = view.state.selection.main.to

    // Insert template at current cursor position
    view.dispatch({
      changes: {
        from,
        to,
        insert: text,
      },
      selection: {
        anchor: cursorIndex !== -1 ? from + cursorIndex : from + text.length,
      },
    })
  }, [])

  return (
    <InsertTemplateContext.Provider value={insertTemplate}>
      {children}
    </InsertTemplateContext.Provider>
  )
}

export function useInsertTemplate() {
  return React.useContext(InsertTemplateContext)
}

export { Provider as InsertTemplateProvider }
