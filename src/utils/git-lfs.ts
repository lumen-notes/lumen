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
