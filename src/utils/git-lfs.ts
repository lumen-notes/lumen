import micromatch from "micromatch"
import { GitHubRepository, GitHubUser } from "../schema"
import { fs } from "./fs"
import { REPO_DIR } from "./git"

/** Check if a file is tracked with Git LFS by checking the .gitattributes file */
export async function isTrackedWithGitLfs(path: string) {
  try {
    // Get .gitattributes file
    const gitAttributes = await fs.promises.readFile(`${REPO_DIR}/.gitattributes`)

    // Parse .gitattributes file
    const parsedGitAttributes = gitAttributes
      .toString()
      .split("\n")
      .reduce(
        (acc, line) => {
          // Ignore comments
          if (line.startsWith("#")) {
            return acc
          }

          // Ignore empty lines
          if (!line.trim()) {
            return acc
          }

          // Split line into parts
          const [pattern, ...attrs] = line.split(" ")

          // Add pattern and filter to accumulator
          return [...acc, { pattern, attrs }]
        },
        [] as Array<{ pattern: string; attrs: string[] }>,
      )

    // Return true if any patterns matching the file path have filter=lfs set
    return parsedGitAttributes.some(({ pattern, attrs }) => {
      // Check if file path matches pattern and if filter=lfs is set
      return (
        micromatch.isMatch(
          path
            // Remove REPO_DIR from path
            .replace(REPO_DIR, "")
            // Remove leading slash from path
            .replace(/^\/*/, ""),
          pattern
            // Remove leading slash from pattern
            .replace(/^\//, ""),
        ) && attrs.includes("filter=lfs")
      )
    })
  } catch (error) {
    return false
  }
}

/** Resolve a Git LFS pointer to a file URL */
export async function resolveGitLfsPointer({
  file,
  githubUser,
  githubRepo,
}: {
  file: File
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  const text = await file.text()

  const response = await fetch(
    `/git-lfs-file?repo=${githubRepo.owner}/${githubRepo.name}&pointer=${text}`,
    {
      headers: {
        Authorization: `Bearer ${githubUser.token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Unable to resolve Git LFS pointer")
  }

  const url = await response.text()

  if (!url) {
    throw new Error("Unable to resolve Git LFS pointer")
  }

  return url
}

/** Create a Git LFS pointer for a given file */
export async function createGitLfsPointer(content: ArrayBuffer) {
  const oid = await getOid(content)
  const size = content.byteLength

  return `version https://git-lfs.github.com/spec/v1
oid sha256:${oid}
size ${size}
`
}

type UploadInfo = {
  exists: boolean
  upload?: { href: string; header: Record<string, string> }
  verify?: { href: string; header: Record<string, string> }
}

/** Upload file to GitHub's Git LFS server using direct browser-to-GitHub upload. */
export async function uploadToGitLfsServer({
  content,
  githubUser,
  githubRepo,
}: {
  content: ArrayBuffer
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  const oid = await getOid(content)
  const size = content.byteLength
  const repo = `${githubRepo.owner}/${githubRepo.name}`

  // Step 1: Get upload URL from Vercel (small request, no file content)
  const uploadInfoResponse = await fetch(`/git-lfs-file?action=get-upload-info`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubUser.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo, oid, size }),
  })

  if (!uploadInfoResponse.ok) {
    throw new Error("Unable to get upload info from Git LFS server")
  }

  const uploadInfo: UploadInfo = await uploadInfoResponse.json()

  // If the file already exists in LFS storage, we're done
  if (uploadInfo.exists) {
    return
  }

  if (!uploadInfo.upload) {
    throw new Error("No upload URL returned from Git LFS server")
  }

  // Step 2: Upload binary directly to GitHub's LFS CDN (bypasses Vercel's body limit)
  const uploadResponse = await fetch(uploadInfo.upload.href, {
    method: "PUT",
    headers: {
      ...uploadInfo.upload.header,
      "Content-Type": "application/octet-stream",
    },
    body: content,
  })

  if (!uploadResponse.ok) {
    throw new Error("Unable to upload file to Git LFS storage")
  }

  // Step 3: Verify the upload through Vercel (small request)
  const verifyResponse = await fetch(`/git-lfs-file?action=verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubUser.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ repo, oid, size }),
  })

  if (!verifyResponse.ok) {
    throw new Error("Unable to verify Git LFS upload")
  }
}

/** Get the OID of a file by hashing its contents with SHA-256 */
export async function getOid(content: ArrayBuffer) {
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
  const hashBuffer = await crypto.subtle.digest("SHA-256", content)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
