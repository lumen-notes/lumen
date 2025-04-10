import { useSetAtom } from "jotai"
import React from "react"
import { globalStateMachineAtom } from "../global-state"
import { Button } from "./button"
import { Dialog } from "./dialog"
import { FormControl } from "./form-control"

const THEME_VARIABLES = {
  "--color-text": "Text",
  "--color-text-secondary": "Secondary Text",
  "--color-text-tertiary": "Tertiary Text",
  "--color-text-danger": "Danger Text",
  "--color-bg": "Background",
  "--color-bg-secondary": "Secondary Background",
  "--color-bg-tertiary": "Tertiary Background",
  "--color-border-primary": "Primary Border",
  "--color-border-secondary": "Secondary Border",
  "--color-border-focus": "Focus Border",
} as const

type ThemeVariable = keyof typeof THEME_VARIABLES

export function ThemeCustomizer() {
  const send = useSetAtom(globalStateMachineAtom)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [colorValues, setColorValues] = React.useState<Record<ThemeVariable, string>>(() => {
    // Get initial colors from CSS variables
    const colors = {} as Record<ThemeVariable, string>
    const style = getComputedStyle(document.documentElement)
    Object.keys(THEME_VARIABLES).forEach((variable) => {
      colors[variable as ThemeVariable] = style.getPropertyValue(variable).trim() || "#000000"
    })
    return colors
  })

  const handleColorChange = (variable: ThemeVariable, value: string) => {
    setColorValues((prev) => ({
      ...prev,
      [variable]: value,
    }))
  }

  const handleSave = () => {
    // Apply colors to CSS variables
    Object.entries(colorValues).forEach(([variable, value]) => {
      document.documentElement.style.setProperty(variable, value)
    })

    // Generate theme.css content
    const cssContent = `:root {
${Object.entries(colorValues)
  .map(([variable, value]) => `  ${variable}: ${value};`)
  .join("\n")}
}
`
    // Save theme.css to the repo
    send({
      type: "WRITE_FILES",
      markdownFiles: { "theme.css": cssContent },
      commitMessage: "Update theme colors",
    })

    setIsDialogOpen(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Dialog.Trigger asChild>
        <Button variant="secondary" size="small">
          Customize Colors
        </Button>
      </Dialog.Trigger>
      <Dialog.Content title="Theme Colors">
        <div className="grid gap-4">
          {(Object.entries(THEME_VARIABLES) as [ThemeVariable, string][]).map(
            ([variable, label]) => (
              <div key={variable} className="flex items-center gap-3">
                <FormControl htmlFor={variable} label={label} className="flex-grow">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id={variable}
                      value={colorValues[variable]}
                      onChange={(e) => handleColorChange(variable, e.target.value)}
                      className="h-8 w-8 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorValues[variable]}
                      onChange={(e) => handleColorChange(variable, e.target.value)}
                      className="flex-grow px-2 py-1 rounded border border-border-secondary bg-bg-secondary"
                    />
                  </div>
                </FormControl>
              </div>
            ),
          )}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" size="small" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="small" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
