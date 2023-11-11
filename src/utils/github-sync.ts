import { Getter, useSetAtom } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import React from "react"
import { githubRepoAtom, githubUserAtom, notesAtom, rawNotesAtom } from "../global-state"
import { writeFiles } from "./github-fs"

// Store SHA to avoid re-fetching notes if the SHA hasn't changed
export const shaAtom = atomWithStorage<string | null>("sha", null)

const githubUserCallback = (get: Getter) => get(githubUserAtom)
const githubRepoCallback = (get: Getter) => get(githubRepoAtom)

const notesCallback = (get: Getter) => get(notesAtom)

export function useRenameTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (oldName: string, newName: string) => {
      const notes = getNotes()

      const updatedRawNotes = [...notes.values()]
        // Notes that contain the old tag
        .filter((note) => note.tags.includes(oldName))
        .reduce<Record<string, string>>((updatedRawNotes, note) => {
          // Find and replace the old tag with the new tag
          updatedRawNotes[note.id] = note.rawBody.replace(`#${oldName}`, `#${newName}`)
          return updatedRawNotes
        }, {})

      // Update state
      setRawNotes((rawNotes) => ({ ...rawNotes, ...updatedRawNotes }))

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        const files = mapObject(updatedRawNotes, (rawBody, id) => {
          return [`${id}.md`, rawBody]
        })

        await writeFiles({
          githubToken: githubUser.token,
          githubRepo,
          files,
          commitMessage: `Rename tag #${oldName} to #${newName}`,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, getGitHubRepo],
  )
}

export function useDeleteTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getGitHubRepo = useAtomCallback(githubRepoCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (tagName: string) => {
      const notes = getNotes()

      // Regex to match the tag and its children
      const tagRegex = new RegExp(`#${tagName}\\b(\\/[\\w\\-_\\d]*)*`, "g")

      const updatedRawNotes = [...notes.values()]
        // Notes that contain the tag to be deleted
        .filter((note) => note.tags.includes(tagName))
        .reduce<Record<string, string>>((updatedRawNotes, note) => {
          // Find and replace the tag with an empty string
          updatedRawNotes[note.id] = note.rawBody.replace(tagRegex, ``)
          return updatedRawNotes
        }, {})

      // Update state
      setRawNotes((rawNotes) => ({ ...rawNotes, ...updatedRawNotes }))

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        const githubRepo = getGitHubRepo()
        if (!githubUser || !githubRepo) return

        const files = mapObject(updatedRawNotes, (rawBody, id) => {
          return [`${id}.md`, rawBody]
        })

        await writeFiles({
          githubToken: githubUser.token,
          githubRepo,
          files,
          commitMessage: `Delete tag #${tagName}`,
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, getGitHubRepo],
  )
}

function mapObject<T, U extends string | number | symbol, V>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => [U, V],
): Record<U, V> {
  const result: Record<U, V> = {} as Record<U, V>
  for (const key in obj) {
    const [newKey, newValue] = fn(obj[key], key)
    result[newKey] = newValue
  }
  return result
}
