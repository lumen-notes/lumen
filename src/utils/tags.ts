import { Getter, useSetAtom } from "jotai"
import { useAtomCallback } from "jotai/utils"
import React from "react"
import { REPO_DIR, githubUserAtom, notesAtom, rawNotesAtom } from "../global-state"
import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { fs } from "./fs"

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
        let newContent = note.content

        newContent = updateTagInContent(newContent, oldName, "rename", newName)

        if (newContent !== note.content) {
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
        let newContent = note.content

        newContent = updateTagInContent(newContent, tagName, "delete")

        if (newContent !== note.content) {
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

export function updateTagInContent(
  content: string,
  tagName: string,
  operation: "rename" | "delete",
  newName = "",
) {
  let newContent = content

  const hashTagPattern = new RegExp(`#${tagName}\\b`, "g")
  const tagsPattern = /tags: \[([^\]]+)\]/g

  if (operation === "rename") {
    newContent = newContent.replace(hashTagPattern, `#${newName}`)
  } else if (operation === "delete") {
    newContent = newContent.replace(hashTagPattern, "")
  }

  let match
  while ((match = tagsPattern.exec(newContent)) !== null) {
    let tagsArray = match[1].split(",").map((tag) => tag.trim())

    if (operation === "rename") {
      tagsArray = tagsArray.map((tag) => (tag === tagName ? newName : tag))
    } else if (operation === "delete") {
      tagsArray = tagsArray.filter((tag) => tag !== tagName)
    }

    const updatedTags = tagsArray.join(", ")
    const newTagsString = updatedTags ? `tags: [${updatedTags}]` : "tags: []"
    newContent = newContent.replace(match[0], newTagsString)
  }

  // Remove any trailing comma and space in the tags list
  newContent = newContent.replace(/tags: \[([^,\]]+),\s*\]/g, "tags: [$1]")

  return newContent
}
