import { useAtomValue, useSetAtom } from "jotai"
import React from "react"
import {
  calendarNotesDirectoryAtom,
  configAtom,
  globalStateMachineAtom,
  isRepoClonedAtom,
  loadConfigAtom,
  setConfigAtom,
} from "../global-state"
import { Config, CONFIG_FILE_PATH, normalizeDirectoryPath, serializeConfig, buildCalendarNoteId } from "../utils/config"

export function useConfig() {
  return useAtomValue(configAtom)
}

export function useCalendarNotesDirectory() {
  return useAtomValue(calendarNotesDirectoryAtom)
}

/**
 * Returns a function to build calendar note IDs with the configured directory.
 * e.g., with directory "journal": buildId("2026-01-26") -> "journal/2026-01-26"
 */
export function useBuildCalendarNoteId() {
  const calendarNotesDir = useAtomValue(calendarNotesDirectoryAtom)
  return React.useCallback(
    (dateOrWeek: string) => buildCalendarNoteId(dateOrWeek, calendarNotesDir),
    [calendarNotesDir],
  )
}

/** Load config from filesystem when repo is cloned */
export function useLoadConfigOnMount() {
  const isRepoCloned = useAtomValue(isRepoClonedAtom)
  const loadConfig = useSetAtom(loadConfigAtom)
  const hasLoadedRef = React.useRef(false)

  React.useEffect(() => {
    if (isRepoCloned && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      loadConfig()
    }
  }, [isRepoCloned, loadConfig])
}

export function useSaveConfig() {
  const send = useSetAtom(globalStateMachineAtom)
  const setConfig = useSetAtom(setConfigAtom)

  return React.useCallback(
    (config: Config) => {
      // Normalize the config before saving
      const normalizedConfig: Config = {
        ...config,
        calendarNotesDirectory: normalizeDirectoryPath(config.calendarNotesDirectory) || undefined,
      }

      // Update the config atom (and localStorage)
      setConfig(normalizedConfig)

      // Write the config file to the repo
      send({
        type: "WRITE_FILES",
        markdownFiles: { [CONFIG_FILE_PATH]: serializeConfig(normalizedConfig) },
        commitMessage: "Update Lumen config",
      })
    },
    [send, setConfig],
  )
}
