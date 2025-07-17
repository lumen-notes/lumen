import micromatch from "micromatch"
import { GitHubRepository, GitHubUser } from "../schema"
import { fs } from "./fs"
import { getRepoDir, REPO_DIR } from "./git"

/** Check if a file is tracked with Git LFS by checking the .gitattributes file */
export async function isTrackedWithGitLfs(path: string) {
  // Extract repo from path if it's a full path
  let repoDir = ""
  let relativePath = path
  
  if (path.startsWith("/repos/")) {
    // This is a full path, extract the repo dir
    const pathParts = path.split("/")
    if (pathParts.length >= 3) {
      repoDir = `/${pathParts[1]}/${pathParts[2]}`
      relativePath = pathParts.slice(3).join("/")
    }
  } else {
    // This is a relative path, assume it's for the legacy REPO_DIR
    repoDir = REPO_DIR
    relativePath = path.replace(/^\//, "")
  }
  
  try {
    // Get .gitattributes file
    const gitAttributes = await fs.promises.readFile(`${repoDir}/.gitattributes`)

    // Parse .gitattributes file
    const parsedGitAttributes = gitAttributes
      .toString()
      .split("\n")
      .reduce((acc, line) => {
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
      }, [] as Array<{ pattern: string; attrs: string[] }>)

    // Return true if any patterns matching the file path have filter=lfs set
    return parsedGitAttributes.some(({ pattern, attrs }) => {
      // Check if file path matches pattern and if filter=lfs is set
      return (
        micromatch.isMatch(
          relativePath,
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

/** Create a Git LFS pointer from file content */
export async function createGitLfsPointer(content: ArrayBuffer) {
  const size = content.byteLength
  const oid = await calculateSha256(content)
  return `version https://git-lfs.github.com/spec/v1\noid sha256:${oid}\nsize ${size}\n`
}

/** Calculate SHA256 hash of content */
async function calculateSha256(content: ArrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", content)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Upload file to Git LFS server */
export async function uploadToGitLfsServer({
  content,
  githubUser,
  githubRepo,
}: {
  content: ArrayBuffer
  githubUser: GitHubUser
  githubRepo: GitHubRepository
}) {
  const size = content.byteLength
  const oid = await calculateSha256(content)
  const base64Content = btoa(String.fromCharCode(...new Uint8Array(content)))

  const response = await fetch(`/git-lfs-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubUser.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo: `${githubRepo.owner}/${githubRepo.name}`,
      content: base64Content,
      oid,
      size,
    }),
  })

  if (!response.ok) {
    throw new Error("Unable to upload file to Git LFS server")
  }
}
