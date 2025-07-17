import LightningFS from "@isomorphic-git/lightning-fs"
import { request } from "@octokit/request"
import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { GitHubRepository, GitHubUser, Note } from "../schema"
import { readFile } from "./fs"
import { getRepoDir, REPO_DIR } from "./git"
import { isTrackedWithGitLfs, resolveGitLfsPointer } from "./git-lfs"
import { stripWikilinks } from "./strip-wikilinks"
import { transformUploadUrls } from "./transform-upload-urls"

export async function createGist({ note, githubUser }: { note: Note; githubUser: GitHubUser }) {
  const filename = `${note.id}.md`

  try {
    const response = await request("POST /gists", {
      headers: {
        authorization: `token ${githubUser.token}`,
      },
      public: false,
      files: {
        [filename]: {
          content: stripWikilinks(note.content),
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Failed to create gist:", error)
    return null
  }
}

const GIST_DB_NAME = "gist"
const gistFs = new LightningFS(GIST_DB_NAME)

export async function updateGist({
  gistId,
  note,
  githubUser,
  githubRepo,
}: {
  gistId: string
  note: Note
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  const filename = `${note.id}.md`
  const gistDir = `/tmp/gist-${gistId}`

  try {
    // Transform upload URLs and get the list of referenced files
    const { content: transformedContent, uploadPaths } = transformUploadUrls({
      content: stripWikilinks(note.content),
      gistId,
      gistOwner: githubUser.login,
    })

    // Clone the gist repository
    await git.clone({
      fs: gistFs,
      http,
      dir: gistDir,
      corsProxy: "/cors-proxy",
      url: `https://gist.github.com/${gistId}.git`,
      singleBranch: true,
      depth: 1,
      onAuth: () => ({
        username: githubUser.login,
        password: githubUser.token,
      }),
    })

    // Delete all existing files and stage deletions
    const existingFiles = await gistFs.promises.readdir(gistDir)
    for (const file of existingFiles) {
      // Skip .git directory
      if (file === ".git") continue
      await gistFs.promises.unlink(`${gistDir}/${file}`)
      await git.remove({
        fs: gistFs,
        dir: gistDir,
        filepath: file,
      })
    }

    // Write the main note content
    await gistFs.promises.writeFile(`${gistDir}/${filename}`, transformedContent)

    // Add file uploads to the gist
    for (const path of uploadPaths) {
      const repoDir = getRepoDir(githubRepo)
      const file = await readFile(`${repoDir}${path}`)

      // If the file is tracked with Git LFS, resolve the pointer and fetch the binary file content
      if (await isTrackedWithGitLfs(`${repoDir}${path}`)) {
        const fileUrl = await resolveGitLfsPointer({
          file,
          githubUser,
          githubRepo,
        })

        // Fetch the binary file content
        const response = await fetch(`/file-proxy?url=${encodeURIComponent(fileUrl)}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch LFS file: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()

        await gistFs.promises.writeFile(`${gistDir}/${file.name}`, Buffer.from(arrayBuffer))
      } else {
        // Otherwise, read the file directly as a binary buffer
        const arrayBuffer = await file.arrayBuffer()
        await gistFs.promises.writeFile(`${gistDir}/${file.name}`, Buffer.from(arrayBuffer))
      }
    }

    // Stage all new and modified files
    await git.add({
      fs: gistFs,
      dir: gistDir,
      filepath: ".",
    })

    // Create commit
    await git.commit({
      fs: gistFs,
      dir: gistDir,
      message: "Update note",
      author: {
        name: githubUser.login,
        email: githubUser.email,
      },
    })

    // Push changes
    await git.push({
      fs: gistFs,
      http,
      dir: gistDir,
      remote: "origin",
      onAuth: () => ({
        username: githubUser.login,
        password: githubUser.token,
      }),
    })
  } catch (error) {
    console.error("Failed to update gist:", error)
  }

  // Clean up
  window.indexedDB.deleteDatabase(GIST_DB_NAME)
}

export async function deleteGist({ githubToken, gistId }: { githubToken: string; gistId: string }) {
  try {
    const response = await request("DELETE /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      gist_id: gistId,
    })

    return response.status === 204
  } catch (error) {
    console.error("Failed to delete gist:", error)
    return false
  }
}
