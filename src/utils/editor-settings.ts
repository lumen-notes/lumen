import { z } from "zod"

const EDITOR_SETTINGS_KEY = "editor_settings"

const editorSettingsSchema = z.object({
  vimMode: z.boolean().default(false),
  lineNumbers: z.boolean().default(false),
  foldGutter: z.boolean().default(false),
})

export function getEditorSettings() {
  const settingsString = window.localStorage.getItem(EDITOR_SETTINGS_KEY)

  if (settingsString) {
    const parsedSettings = editorSettingsSchema.safeParse(JSON.parse(settingsString))
    return parsedSettings.success ? parsedSettings.data : editorSettingsSchema.parse({})
  }

  return editorSettingsSchema.parse({})
}

export function setEditorSettings(newSettings: Partial<z.infer<typeof editorSettingsSchema>>) {
  const currentSettings = getEditorSettings()
  window.localStorage.setItem(
    EDITOR_SETTINGS_KEY,
    JSON.stringify({ ...currentSettings, ...newSettings }),
  )
}
