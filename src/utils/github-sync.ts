import { Getter, useSetAtom } from "jotai"
import { atomWithStorage, useAtomCallback } from "jotai/utils"
import React from "react"
import { REPO_DIR, githubUserAtom, notesAtom, rawNotesAtom } from "../global-state"
import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { fs } from "./fs"
import { logFileSystemState } from "./logFileSystem"

// Store SHA to avoid re-fetching notes if the SHA hasn't changed
export const shaAtom = atomWithStorage<string | null>("sha", null)

const githubUserCallback = (get: Getter) => get(githubUserAtom)
const notesCallback = (get: Getter) => get(notesAtom)

export function useRenameTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (oldName: string, newName: string) => {
      const notes = getNotes()

      const updatedNotesContent: Record<string, string> = {}
      for (const note of notes.values()) {
        if (note.tags.includes(oldName)) {
          const newContent = note.content.replace(`#${oldName}`, `#${newName}`)
          updatedNotesContent[note.id] = newContent

          // Write updated content to fs
          await fs.promises.writeFile(`${REPO_DIR}/${note.id}.md`, newContent, "utf8")
          await git.add({ fs, dir: REPO_DIR, filepath: `${note.id}.md` })
        }
      }

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        if (!githubUser) return

        await git.commit({
          fs,
          dir: REPO_DIR,
          message: `Rename tag #${oldName} to #${newName}`,
          author: {
            name: githubUser.name,
            email: githubUser.email,
          },
        })

        await git.push({
          fs,
          http,
          dir: REPO_DIR,
          onAuth: () => ({ username: githubUser.login, password: githubUser.token }),
        })

        setRawNotes((rawNotes) => {
          return { ...rawNotes, ...updatedNotesContent }
        })

        await logFileSystemState(fs)
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, REPO_DIR],
  )
}

export function useDeleteTag() {
  const getGitHubUser = useAtomCallback(githubUserCallback)
  const getNotes = useAtomCallback(notesCallback)
  const setRawNotes = useSetAtom(rawNotesAtom)

  return React.useCallback(
    async (tagName: string) => {
      const notes = getNotes()

      const updatedNotesContent: Record<string, string> = {}
      for (const note of notes.values()) {
        if (note.tags.includes(tagName)) {
          // Find and replace the tag with an empty string
          const newContent = note.content.replace(
            new RegExp(`#${tagName}\\b(\\/[\\w\\-_\\d]*)*`, "g"),
            "",
          )
          updatedNotesContent[note.id] = newContent

          // Write updated content to fs
          await fs.promises.writeFile(`${REPO_DIR}/${note.id}.md`, newContent, "utf8")
          await git.add({ fs, dir: REPO_DIR, filepath: `${note.id}.md` })
        }
      }

      // Push to GitHub
      try {
        const githubUser = getGitHubUser()
        if (!githubUser) return

        await git.commit({
          fs,
          dir: REPO_DIR,
          message: `Delete tag #${tagName}`,
          author: {
            name: githubUser.name,
            email: githubUser.email,
          },
        })

        await git.push({
          fs,
          http,
          dir: REPO_DIR,
          onAuth: () => ({ username: githubUser.login, password: githubUser.token }),
        })

        setRawNotes((rawNotes) => {
          return { ...rawNotes, ...updatedNotesContent }
        })
      } catch (error) {
        // TODO: Display error
        console.error(error)
      }
    },
    [getNotes, setRawNotes, getGitHubUser, REPO_DIR],
  )
}

// function mapObject<T, U extends string | number | symbol, V>(
//   obj: Record<string, T>,
//   fn: (value: T, key: string) => [U, V],
// ): Record<U, V> {
//   const result: Record<U, V> = {} as Record<U, V>
//   for (const key in obj) {
//     const [newKey, newValue] = fn(obj[key], key)
//     result[newKey] = newValue
//   }
//   return result
// }
