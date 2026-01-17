import { EditorView } from "@codemirror/view"
import { sentenceCase } from "change-case"
import ejs from "ejs"
import { atom, useAtom, useSetAtom } from "jotai"
import React, { useCallback } from "react"
import { Template } from "../schema"
import { toDateString } from "../utils/date"
import { Button } from "./button"
import { Dialog } from "./dialog"
import { FormControl } from "./form-control"
import { ErrorIcon16, LoadingIcon16 } from "./icons"
import { TextInput } from "./text-input"

// Template pending insertion into editor because it requires user input
const pendingTemplateAtom = atom<{ template: Template; editor: EditorView } | null>(null)

export function useInsertTemplate() {
  const setPendingTemplate = useSetAtom(pendingTemplateAtom)

  const insertTemplate = useCallback(
    (template: Template, editor: EditorView) => {
      if (template.inputs) {
        console.log("insertTemplate", template, editor)
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
    <Dialog open onOpenChange={handleClose}>
      <Dialog.Content title={template.name}>
        <div className="grid gap-4">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {Object.entries(template.inputs ?? {}).map(
                ([name, { required, default: defaultValue }], index) => (
                  <FormControl
                    key={name}
                    htmlFor={name}
                    label={formatLabel(name)}
                    required={required}
                  >
                    <TextInput
                      id={name}
                      name={name}
                      type="text"
                      required={required}
                      defaultValue={defaultValue}
                      // Focus first input instead of close button
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus={index === 0}
                    />
                  </FormControl>
                ),
              )}
            </div>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? <LoadingIcon16 /> : "Insert"}
            </Button>
            {error ? (
              <div className="flex items-start gap-2 text-text-danger">
                <div className="grid h-5 shrink-0 place-items-center">
                  <ErrorIcon16 />
                </div>
                <pre className="whitespace-pre-wrap font-mono">{error.message}</pre>
              </div>
            ) : null}
          </form>
        </div>
      </Dialog.Content>
    </Dialog>
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
    { date: toDateString(new Date()), ...args },
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

export function removeFrontmatterComments(text: string) {
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
