import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { GitHubRepository, GitHubUser } from "../schema"
import { fs, fsWipe } from "./fs"
import { startTimer } from "./timer"

export const REPOS_BASE_DIR = "/repos"
const DEFAULT_BRANCH = "main"

// Helper function to get the directory for a specific repo
export function getRepoDir(repo: GitHubRepository): string {
  return `${REPOS_BASE_DIR}/${repo.owner}_${repo.name}`
}

// Legacy export for backward compatibility
export const REPO_DIR = "/repo"

export async function gitClone(repo: GitHubRepository, user: GitHubUser) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.clone>[0] = {
    fs,
    http,
    dir: repoDir,
    // corsProxy: "https://cors.isomorphic-git.org",
    corsProxy: "/cors-proxy",
    url: `https://github.com/${repo.owner}/${repo.name}`,
    ref: DEFAULT_BRANCH,
    singleBranch: true,
    depth: 1,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  }

  // Create repos directory if it doesn't exist
  try {
    await fs.promises.mkdir(REPOS_BASE_DIR)
  } catch (error) {
    // Directory already exists, ignore error
  }

  // Remove existing repo directory if it exists
  try {
    await fs.promises.rmdir(repoDir, { recursive: true })
  } catch (error) {
    // Directory doesn't exist, ignore error
  }

  // Clone repo
  let stopTimer = startTimer(`git clone ${options.url} ${options.dir}`)
  await git.clone(options)
  stopTimer()

  // Set user in git config
  stopTimer = startTimer(`git config user.name "${user.name}"`)
  await git.setConfig({ fs, dir: repoDir, path: "user.name", value: user.name })
  stopTimer()

  // Set email in git config
  stopTimer = startTimer(`git config user.email "${user.email}"`)
  await git.setConfig({ fs, dir: repoDir, path: "user.email", value: user.email })
  stopTimer()
}

export async function gitPull(repo: GitHubRepository, user: GitHubUser) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.pull>[0] = {
    fs,
    http,
    dir: repoDir,
    singleBranch: true,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  }

  const stopTimer = startTimer("git pull")
  await git.pull(options)
  stopTimer()
}

export async function gitPush(repo: GitHubRepository, user: GitHubUser) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.push>[0] = {
    fs,
    http,
    dir: repoDir,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  }

  const stopTimer = startTimer("git push")
  await git.push(options)
  stopTimer()
}

export async function gitAdd(repo: GitHubRepository, filePaths: string[]) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.add>[0] = {
    fs,
    dir: repoDir,
    filepath: filePaths,
  }

  const stopTimer = startTimer(`git add ${filePaths.join(" ")}`)
  await git.add(options)
  stopTimer()
}

export async function gitRemove(repo: GitHubRepository, filePath: string) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.remove>[0] = {
    fs,
    dir: repoDir,
    filepath: filePath,
  }

  const stopTimer = startTimer(`git remove ${filePath}`)
  await git.remove(options)
  stopTimer()
}

export async function gitCommit(repo: GitHubRepository, message: string) {
  const repoDir = getRepoDir(repo)
  const options: Parameters<typeof git.commit>[0] = {
    fs,
    dir: repoDir,
    message,
  }

  const stopTimer = startTimer(`git commit -m "${message}"`)
  await git.commit(options)
  stopTimer()
}

/** Check if the repo is synced with the remote origin */
export async function isRepoSynced(repo: GitHubRepository) {
  const repoDir = getRepoDir(repo)
  const latestLocalCommit = await git.resolveRef({
    fs,
    dir: repoDir,
    ref: `refs/heads/${DEFAULT_BRANCH}`,
  })

  const latestRemoteCommit = await git.resolveRef({
    fs,
    dir: repoDir,
    ref: `refs/remotes/origin/${DEFAULT_BRANCH}`,
  })

  const isSynced = latestLocalCommit === latestRemoteCommit

  return isSynced
}

export async function getRemoteOriginUrl(repo: GitHubRepository) {
  const repoDir = getRepoDir(repo)
  // Check git config for remote origin url
  const remoteOriginUrl = await git.getConfig({
    fs,
    dir: repoDir,
    path: "remote.origin.url",
  })

  return remoteOriginUrl
}

// Helper function to check if a repo is cloned
export async function isRepoCloned(repo: GitHubRepository): Promise<boolean> {
  const repoDir = getRepoDir(repo)
  try {
    await fs.promises.stat(`${repoDir}/.git`)
    return true
  } catch {
    return false
  }
}

// Helper function to list all cloned repos
export async function listClonedRepos(): Promise<GitHubRepository[]> {
  try {
    const entries = await fs.promises.readdir(REPOS_BASE_DIR)
    const repos: GitHubRepository[] = []
    
    for (const entry of entries) {
      const parts = entry.split('_')
      if (parts.length >= 2) {
        const owner = parts[0]
        const name = parts.slice(1).join('_') // Handle repo names with underscores
        repos.push({ owner, name })
      }
    }
    
    return repos
  } catch {
    return []
  }
}

// Helper function to remove a cloned repo
export async function removeClonedRepo(repo: GitHubRepository): Promise<void> {
  const repoDir = getRepoDir(repo)
  try {
    await fs.promises.rmdir(repoDir, { recursive: true })
  } catch (error) {
    // Directory doesn't exist, ignore error
  }
}
