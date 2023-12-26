import { GitHubRepository, GitHubUser } from "../schema"
import { fsWipe, fs } from "./fs"
import git from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { startTimer } from "./timer"

export const REPO_DIR = `/repo`
const DEFAULT_BRANCH = "main"

export async function gitClone(repo: GitHubRepository, user: GitHubUser) {
  const options: Parameters<typeof git.clone>[0] = {
    fs,
    http,
    dir: REPO_DIR,
    corsProxy: "https://cors.isomorphic-git.org",
    url: `https://github.com/${repo.owner}/${repo.name}`,
    ref: DEFAULT_BRANCH,
    singleBranch: true,
    depth: 1,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  }

  // Wipe file system
  // TODO: Only remove the repo directory instead of wiping the entire file system
  // Blocked by https://github.com/isomorphic-git/lightning-fs/issues/71
  fsWipe()

  // Clone repo
  let stopTimer = startTimer(`git clone ${options.url} ${options.dir}`)
  await git.clone(options)
  stopTimer()

  // Set user in git config
  stopTimer = startTimer(`git config user.name "${user.name}"`)
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: user.name })
  stopTimer()

  // Set email in git config
  stopTimer = startTimer(`git config user.email "${user.email}"`)
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: user.email })
  stopTimer()
}

// gitPull
// gitPush
// gitAdd
// gitDelete
// gitCommit
