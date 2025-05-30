import git from "isomorphic-git";
import http from "isomorphic-git/http/web";
import { fs, fsWipe } from "../utils/fs";

// Define simple types for GitHubRepository and GitHubUser for clarity
// In a real app, these might be more complex or imported from a shared types file
interface GitHubRepository {
  owner: string;
  name: string;
}

interface GitHubUser {
  login: string;
  token: string;
  name: string;
  email: string;
}

const REPO_DIR = "/repo";
const DEFAULT_BRANCH = "main";

self.onmessage = async (event) => {
  const { operation, payload } = event.data;

  try {
    let result: any;
    switch (operation) {
      case "gitClone":
        if (!payload || !payload.repo || !payload.user) {
          throw new Error("Missing repo or user in payload for gitClone");
        }
        result = await gitCloneHandler(payload.repo, payload.user);
        break;
      case "gitPull":
        if (!payload || !payload.user) {
          throw new Error("Missing user in payload for gitPull");
        }
        result = await gitPullHandler(payload.user);
        break;
      case "gitPush":
        if (!payload || !payload.user) {
          throw new Error("Missing user in payload for gitPush");
        }
        result = await gitPushHandler(payload.user);
        break;
      case "gitAdd":
        if (!payload || !payload.filePaths) {
          throw new Error("Missing filePaths in payload for gitAdd");
        }
        result = await gitAddHandler(payload.filePaths);
        break;
      case "gitRemove":
        if (!payload || !payload.filePath) {
          throw new Error("Missing filePath in payload for gitRemove");
        }
        result = await gitRemoveHandler(payload.filePath);
        break;
      case "gitCommit":
        if (!payload || !payload.message) {
          throw new Error("Missing message in payload for gitCommit");
        }
        result = await gitCommitHandler(payload.message);
        break;
      case "isRepoSynced":
        result = await isRepoSyncedHandler();
        break;
      case "getRemoteOriginUrl":
        result = await getRemoteOriginUrlHandler();
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    self.postMessage({ status: "success", operation, data: result });
  } catch (e: any) {
    self.postMessage({ status: "error", operation, error: e.message });
  }
};

async function gitCloneHandler(repo: GitHubRepository, user: GitHubUser) {
  const options: Parameters<typeof git.clone>[0] = {
    fs,
    http,
    dir: REPO_DIR,
    corsProxy: "/cors-proxy",
    url: `https://github.com/${repo.owner}/${repo.name}`,
    ref: DEFAULT_BRANCH,
    singleBranch: true,
    depth: 1,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  };

  fsWipe(); // Wipe file system before clone

  console.time(`git clone ${options.url} ${options.dir}`);
  await git.clone(options);
  console.timeEnd(`git clone ${options.url} ${options.dir}`);

  console.time(`git config user.name "${user.name}"`);
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: user.name });
  console.timeEnd(`git config user.name "${user.name}"`);

  console.time(`git config user.email "${user.email}"`);
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: user.email });
  console.timeEnd(`git config user.email "${user.email}"`);

  return `Successfully cloned ${repo.owner}/${repo.name} and configured user.`;
}

async function gitPullHandler(user: GitHubUser) {
  const options: Parameters<typeof git.pull>[0] = {
    fs,
    http,
    dir: REPO_DIR,
    singleBranch: true,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  };

  console.time("git pull");
  await git.pull(options);
  console.timeEnd("git pull");
  return "Pull successful.";
}

async function gitPushHandler(user: GitHubUser) {
  const options: Parameters<typeof git.push>[0] = {
    fs,
    http,
    dir: REPO_DIR,
    onMessage: (message) => console.debug("onMessage", message),
    onProgress: (progress) => console.debug("onProgress", progress),
    onAuth: () => ({ username: user.login, password: user.token }),
  };

  console.time("git push");
  await git.push(options);
  console.timeEnd("git push");
  return "Push successful.";
}

async function gitAddHandler(filePaths: string[]) {
   const options: Parameters<typeof git.add>[0] = {
    fs,
    dir: REPO_DIR,
    filepath: filePaths, // Corrected: should be filepath (singular)
  };

  console.time(`git add ${Array.isArray(filePaths) ? filePaths.join(" ") : filePaths}`);
  await git.add(options);
  console.timeEnd(`git add ${Array.isArray(filePaths) ? filePaths.join(" ") : filePaths}`);
  return `Added ${Array.isArray(filePaths) ? filePaths.join(", ") : filePaths}.`;
}

async function gitRemoveHandler(filePath: string) {
  const options: Parameters<typeof git.remove>[0] = {
    fs,
    dir: REPO_DIR,
    filepath: filePath,
  };

  console.time(`git remove ${filePath}`);
  await git.remove(options);
  console.timeEnd(`git remove ${filePath}`);
  return `Removed ${filePath}.`;
}

async function gitCommitHandler(message: string) {
  const options: Parameters<typeof git.commit>[0] = {
    fs,
    dir: REPO_DIR,
    message,
  };

  console.time(`git commit -m "${message}"`);
  const sha = await git.commit(options);
  console.timeEnd(`git commit -m "${message}"`);
  return `Committed with SHA: ${sha}`;
}

async function isRepoSyncedHandler() {
  console.time("isRepoSynced");
  const latestLocalCommit = await git.resolveRef({
    fs,
    dir: REPO_DIR,
    ref: `refs/heads/${DEFAULT_BRANCH}`,
  });

  const latestRemoteCommit = await git.resolveRef({
    fs,
    dir: REPO_DIR,
    ref: `refs/remotes/origin/${DEFAULT_BRANCH}`,
  });
  console.timeEnd("isRepoSynced");

  return latestLocalCommit === latestRemoteCommit;
}

async function getRemoteOriginUrlHandler() {
  console.time("getRemoteOriginUrl");
  const remoteOriginUrl = await git.getConfig({
    fs,
    dir: REPO_DIR,
    path: "remote.origin.url",
  });
  console.timeEnd("getRemoteOriginUrl");
  return remoteOriginUrl;
}
