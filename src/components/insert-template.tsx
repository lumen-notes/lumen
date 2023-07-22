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
import { atom, useAtom, useSetAtom } from "jotai"
import { IconButton } from "./icon-button"
import { CloseIcon16, ErrorIcon16, LoadingIcon16 } from "./icons"

// Template pending insertion into editor because it requires user input
const pendingTemplateAtom = atom<{ template: Template; editor: EditorView } | null>(null)

export function useInsertTemplate() {
  const setPendingTemplate = useSetAtom(pendingTemplateAtom)

  const insertTemplate = React.useCallback(
    (template: Template, editor: EditorView) => {
      if (template.inputs) {
        // If template has inputs, open dialog
        setPendingTemplate({ template, editor })
      } else {
        // Otherwise, insert template immediately
        renderAndInsert(template, editor)
      }
    },
    [setPendingTemplate],
  )

  return insertTemplate
}

// TODO: Prevent other dialogs from opening while this one is open
export function InsertTemplateDialog() {
  const [pendingTemplate, setPendingTemplate] = useAtom(pendingTemplateAtom)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  function handleClose() {
    setPendingTemplate(null)

    // Focus editor after dialog closes
    const editor = pendingTemplate?.editor

    if (editor) {
      setTimeout(() => editor.focus())
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!pendingTemplate) return

    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const args = Object.fromEntries(formData.entries())

    try {
      setIsLoading(true)
      await renderAndInsert(pendingTemplate.template, pendingTemplate.editor, args)
      setError(null)
      handleClose()
    } catch (error) {
      console.error(error)
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't render dialog if there's no pending template
  if (!pendingTemplate) return null

  const { template } = pendingTemplate

  return (
    <Dialog.Root open onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-bg-inset-backdrop" />
        <Dialog.Content asChild>
          <Card
            elevation={2}
            className="fixed left-1/2 top-2 z-20 max-h-[85vh] w-[calc(100vw_-_1rem)] max-w-md -translate-x-1/2 overflow-auto focus:outline-none sm:top-[10vh]"
          >
            <div className="grid gap-5 p-4">
              <div className="flex items-center justify-between">
                <Dialog.Title className="text-xl font-semibold leading-4">
                  {template.name}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <IconButton aria-label="Close" className="-m-2">
                    <CloseIcon16 />
                  </IconButton>
                </Dialog.Close>
              </div>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {Object.entries(template.inputs ?? {}).map(
                  ([name, { required, default: defaultValue }], index) => (
                    <div key={name} className="grid gap-2">
                      <label htmlFor={name} className="leading-4">
                        {formatLabel(name)}
                        {required ? <span className="ml-1 text-text-secondary">*</span> : null}
                      </label>
                      <Input
                        id={name}
                        name={name}
                        type="text"
                        required={required}
                        defaultValue={defaultValue}
                        // Focus first input instead of close button
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={index === 0}
                      />
                    </div>
                  ),
                )}
                <Button type="submit" variant="primary" className="mt-2" disabled={isLoading}>
                  {isLoading ? <LoadingIcon16 /> : "Insert"}
                </Button>
                {error ? (
                  <div className="flex items-start gap-2 leading-5 text-text-danger">
                    <div className="grid h-5 flex-shrink-0 place-items-center">
                      <ErrorIcon16 />
                    </div>
                    <p>
                      <span className="font-semibold">Error:</span> {error.message}
                    </p>
                  </div>
                ) : null}
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

async function renderAndInsert(
  template: Template,
  editor: EditorView,
  args: Record<string, unknown> = {},
) {
  let text = await ejs.render(
    template.body,
    { date: `[[${toDateString(new Date())}]]`, ...args },
    { async: true },
  )

  text = removeFrontmatterComments(text)

  // Find cursor position
  const cursorIndex = text.indexOf("{cursor}")

  // Remove "{cursor}" from template body
  text = text.replace("{cursor}", "")

  const from = editor.state.selection.main.from
  const to = editor.state.selection.main.to

  // Insert template at current cursor position
  editor.dispatch({
    changes: {
      from,
      to,
      insert: text,
    },
    selection: {
      anchor: cursorIndex !== -1 ? from + cursorIndex : from + text.length,
    },
  })
}

function removeFrontmatterComments(text: string) {
  const lines = text.split("\n")
  const frontmatterStart = lines.findIndex((line) => line.startsWith("---"))
  const frontmatterEnd =
    lines.slice(frontmatterStart + 1).findIndex((line) => line.startsWith("---")) +
    frontmatterStart +
    1

  if (frontmatterStart === -1 || frontmatterEnd === -1) {
    return text
  }

  const frontmatterLines = lines
    .slice(frontmatterStart, frontmatterEnd + 1)
    .filter((line) => !line.startsWith("#"))
  return lines
    .slice(0, frontmatterStart)
    .concat(frontmatterLines)
    .concat(lines.slice(frontmatterEnd + 1))
    .join("\n")
}
