import { EditorView } from "@codemirror/view"
import ejs from "ejs"
import React from "react"
import { Template } from "../types"
import { toDateString } from "../utils/date"
import * as Dialog from "@radix-ui/react-dialog"
import { Card } from "./card"
import { Button } from "./button"
import { Input } from "./input"
import { sentenceCase } from "sentence-case"

const InsertTemplateContext = React.createContext<(template: Template, view: EditorView) => void>(
  () => {},
)

export function useInsertTemplate() {
  return React.useContext(InsertTemplateContext)
}

async function getSiteTitle(url: string) {
  const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
  const { contents } = (await response.json()) as any
  const title = contents.match(/<title>(?<title>.*)<\/title>/)?.groups?.title ?? ""
  return title
}

export function InsertTemplateProvider({ children }: { children: React.ReactNode }) {
  // const [isDialogOpen, setIsDialogOpen] = React.useState(true)
  const [template, setTemplate] = React.useState<Template | null>(null)
  const viewRef = React.useRef<EditorView>()

  const insertTemplate = React.useCallback((template: Template, view: EditorView) => {
    if (template.inputs) {
      setTemplate(template)
      viewRef.current = view
      return
    }

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

  const closeDialog = React.useCallback(() => {
    setTemplate(null)
    console.log(viewRef.current)
    setTimeout(() => viewRef.current?.focus())
    // viewRef.current?.focus()
  }, [])

  const handleSubmit = React.useCallback(
    async (template: Template, args: Record<string, unknown>) => {
      const view = viewRef.current
      if (!view) return

      let text = await ejs.render(
        template.body,
        {
          date: `[[${toDateString(new Date())}]]`,
          getSiteTitle,
          ...args,
        },
        { async: true },
      )

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

      closeDialog()
    },
    [closeDialog],
  )

  return (
    <InsertTemplateContext.Provider value={insertTemplate}>
      <>
        {children}
        <TemplateFormDialog
          template={template}
          onSubmit={handleSubmit}
          onOpenChange={closeDialog}
        />
      </>
    </InsertTemplateContext.Provider>
  )
}

type TemplateFormDialogProps = {
  template?: Template | null
  onSubmit?: (template: Template, args: Record<string, unknown>) => void
  onOpenChange?: (open: boolean) => void
}

// TODO: Handle errors
// TODO: Show loading indicator
function TemplateFormDialog({ template, onSubmit, onOpenChange }: TemplateFormDialogProps) {
  if (!template) return null

  return (
    <Dialog.Root open onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-bg-inset-backdrop backdrop-blur-sm" />
        <Dialog.Content asChild>
          <Card
            elevation={2}
            className="fixed left-[50%] top-[50%] z-20 max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] overflow-auto focus:outline-none"
          >
            <div className="grid gap-5 p-4">
              <Dialog.Title className="text-xl font-semibold !leading-none">
                {template.name}
              </Dialog.Title>
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  const args = Object.fromEntries(formData.entries())
                  console.log(args)
                  onSubmit?.(template, args)
                }}
              >
                {Object.entries(template?.inputs ?? {}).map(([name, { required }]) => (
                  <div key={name} className="grid gap-2">
                    <label htmlFor={name} className="leading-4">
                      {formatLabel(name)}
                      {required ? " *" : ""}
                    </label>
                    <Input id={name} name={name} type="text" required={required} />
                  </div>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Dialog.Close asChild>
                    <Button type="button">Cancel</Button>
                  </Dialog.Close>
                  <Button type="submit" variant="primary">
                    Insert
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function formatLabel(key: string) {
  switch (key) {
    case "isbn":
      return "ISBN"
    case "url":
      return "URL"
    case "github":
      return "GitHub"
    default:
      return sentenceCase(key)
  }
}
