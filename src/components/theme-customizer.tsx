import React from "react"
import { Button } from "./button"
import { Dialog } from "./dialog"
import { Tooltip } from "./tooltip"
import { ThemeColor, THEME_COLORS_MAP, getCurrentTheme, applyTheme, useSaveTheme } from "../hooks/theme"

export function ThemeCustomizer() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [currentTheme, setCurrentTheme] = React.useState<ThemeColor>(() => getCurrentTheme())
  const saveTheme = useSaveTheme()

  const handleThemeChange = (color: ThemeColor) => {
    setCurrentTheme(color)
    applyTheme(color)
  }

  const handleSave = async () => {
    await saveTheme(currentTheme)
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
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Color Theme</label>
            <div className="flex gap-2 items-center">
              {Object.entries(THEME_COLORS_MAP).map(([color, value]) => (
                <Tooltip key={color}>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => handleThemeChange(color as ThemeColor)}
                      className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-border-focus relative"
                      style={{ backgroundColor: value }}
                      aria-label={`Apply ${color} theme`}
                    >
                      {color === currentTheme && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-border-focus" />
                      )}
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="top">{color}</Tooltip.Content>
                </Tooltip>
              ))}
            </div>
          </div>
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
