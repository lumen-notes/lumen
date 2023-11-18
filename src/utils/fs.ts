import LightningFS from "@isomorphic-git/lightning-fs"
import mime from "mime"
import { GitHubRepository, GitHubUser } from "../types"
import { isTrackedWithGitLfs, resolveGitLfsPointer } from "./git-lfs"

const DB_NAME = "fs"

// TODO: Investigate memfs + OPFS as a more performant alternative to lightning-fs + IndexedDB
// Reference: https://github.com/streamich/memfs/tree/c8bfa38aa15f1d3c9f326e9c25c8972326193a26/demo/git-opfs
export const fs = new LightningFS(DB_NAME)

/** Delete file system database */
export function fsWipe() {
  window.indexedDB.deleteDatabase(DB_NAME)
}

/**
 * The same as fs.promises.readFile(),
 * but it returns a File object instead of string or Uint8Array
 */
export async function readFile(path: string) {
  let content = await fs.promises.readFile(path)

  // If content is a string, convert it to a Uint8Array
  if (typeof content === "string") {
    content = new TextEncoder().encode(content)
  }

  const mimeType = mime.getType(path) ?? ""
  const filename = path.split("/").pop() ?? ""
  return new File([content], filename, { type: mimeType })
}

/** Returns a URL to the given file */
export async function getFileUrl({
  file,
  githubUser,
  githubRepo,
}: {
  file: File
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  // If file is tracked with Git LFS, resolve the pointer
  if (await isTrackedWithGitLfs(file)) {
    return await resolveGitLfsPointer({ file, githubUser, githubRepo })
  } else {
    return URL.createObjectURL(file)
  }
}

/** Write a file to the file system and handle Git LFS automatically if needed */
export async function writeFile({
  path,
  content,
  githubUser,
  githubRepo,
}: {
  path: string
  content: ArrayBuffer
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  // TODO:
  // Use .gitattributes file to determine if file is tracked with Git LFS
  // If file is tracked with Git LFS:
  // - Upload the file to GitHub's LFS server
  // - Write a Git LFS pointer to the file system
  // Otherwise:
  // - Write the file to the file system
}
