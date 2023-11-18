import { GitHubRepository, GitHubUser } from "../types"

/**
 * Check if a file is tracked with Git LFS by checking
 * if the file is actually a Git LFS pointer
 */
// TODO: Use .gitattributes file to determine if file is tracked with Git LFS
export async function isTrackedWithGitLfs(file: File) {
  const text = await file.text()
  return text.startsWith("version https://git-lfs.github.com/spec/")
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

  // Parse the Git LFS pointer
  const oid = text.match(/oid sha256:(?<oid>[a-f0-9]{64})/)?.groups?.oid
  const size = text.match(/size (?<size>\d+)/)?.groups?.size

  if (!oid || !size) {
    throw new Error("Invalid Git LFS pointer")
  }

  // Fetch the file URL from GitHub
  // TODO: Use proxy to avoid CORS issues
  const response = await fetch(
    `https://github.com/${githubRepo.owner}/${githubRepo.name}.git/info/lfs/objects/batch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.git-lfs+json",
        Authorization: `Bearer ${githubUser.token}`,
      },
      body: JSON.stringify({
        operation: "download",
        transfers: ["basic"],
        objects: [{ oid, size }],
      }),
    },
  )

  const json = await response.json()

  console.log(json)

  return ""
}
