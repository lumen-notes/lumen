import LightningFS from "@isomorphic-git/lightning-fs"
import mime from "mime"
import { GitHubRepository, GitHubUser } from "../types"
import {
  createGitLfsPointer,
  isTrackedWithGitLfs,
  resolveGitLfsPointer,
  uploadToGitLfsServer,
} from "./git-lfs"

export const ROOT_DIR = "/root"
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
 * except it prepends the root directory to the path
 * and it returns a File object instead of string or Uint8Array
 */
export async function readFile(path: string) {
  let content = await fs.promises.readFile(`${ROOT_DIR}${path}`)

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
  path,
  githubUser,
  githubRepo,
}: {
  file: File
  path: string
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  // If file is tracked with Git LFS, resolve the pointer
  if (await isTrackedWithGitLfs(path)) {
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
  if (await isTrackedWithGitLfs(path)) {
    await uploadToGitLfsServer({ content, githubUser, githubRepo })

    // Write a Git LFS pointer to the file system
    const pointer = await createGitLfsPointer(content)
    await fs.promises.writeFile(`${ROOT_DIR}${path}`, pointer)
  } else {
    // TODO: Test this
    await fs.promises.writeFile(`${ROOT_DIR}${path}`, Buffer.from(content))
  }
}
