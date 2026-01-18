import LightningFS from "@isomorphic-git/lightning-fs"
import mime from "mime"
import { GitHubRepository, GitHubUser } from "../schema"
import {
  createGitLfsPointer,
  isTrackedWithGitLfs,
  resolveGitLfsPointer,
  uploadToGitLfsServer,
} from "./git-lfs"
import { REPO_DIR } from "./git"

const DB_NAME = "fs"

// TODO: Investigate memfs + OPFS as a more performant alternative to lightning-fs + IndexedDB
// Reference: https://github.com/streamich/memfs/tree/c8bfa38aa15f1d3c9f326e9c25c8972326193a26/demo/git-opfs
export const fs = new LightningFS(DB_NAME)

/** Delete file system database */
export function fsWipe() {
  const indexedDB = globalThis.indexedDB
    indexedDB.deleteDatabase(DB_NAME)
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
  return new File([content as BlobPart], filename, { type: mimeType })
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
    await fs.promises.writeFile(path, pointer)
  } else {
    // TODO: Test this
    await fs.promises.writeFile(path, Buffer.from(content))
  }
}

/** Log the state of the file system to the console */
export async function fsDebug(fs: LightningFS, dir = REPO_DIR) {
  try {
    // List files and directories at the specified path
    const files = await fs.promises.readdir(dir)

    console.log(`Contents of ${dir}:`, files)

    // Iterate over each file/directory
    for (const file of files) {
      // Ensure there is a slash between the directory and file names
      const filePath = `${dir}/${file}`

      const stats = await fs.promises.stat(filePath)
      if (stats.isDirectory()) {
        // If directory, recursively log its contents
        await fsDebug(fs, `${filePath}/`)
      } else {
        // If file, read and log its contents
        const content = await fs.promises.readFile(filePath, "utf8")
        console.log(`Contents of ${filePath}:`, content)
      }
    }
  } catch (error) {
    console.error("Error logging file system state:", error)
  }
}
