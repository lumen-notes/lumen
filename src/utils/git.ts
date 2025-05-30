import { GitHubRepository, GitHubUser } from "../schema";

// Initialize the worker
const worker = new Worker(new URL("../workers/git-worker.ts", import.meta.url), { type: "module" });

// REPO_DIR and DEFAULT_BRANCH are no longer needed here, they are managed by the worker.
// fsWipe is also handled by the worker for the gitClone operation.
// startTimer calls are removed as timing is handled by the worker or not at all.

function createWorkerPromise<T>(operation: string, payload: any): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const messageListener = (event: MessageEvent) => {
      if (event.data.operation === operation) {
        if (event.data.status === "success") {
          resolve(event.data.data as T);
        } else {
          reject(new Error(event.data.error));
        }
        worker.removeEventListener("message", messageListener);
        worker.removeEventListener("error", errorListener);
      }
    };

    const errorListener = (event: ErrorEvent) => {
      // This handles general worker errors, not specific operation errors from postMessage
      // Specific operation errors are expected to come via the 'message' event with status: "error"
      if (event.message.includes("Unknown operation") && event.filename.includes("git-worker")) {
        // This is likely an error from the worker's onmessage handler itself, for an unknown operation
        // We tie it to the current operation if no specific message has been received yet.
         reject(new Error(`Worker error for operation ${operation}: ${event.message}`));
      } else {
        // Generic worker error not tied to a specific operation response
        reject(new Error(`Generic worker error: ${event.message}`));
      }
      worker.removeEventListener("message", messageListener);
      worker.removeEventListener("error", errorListener);
    };

    worker.addEventListener("message", messageListener);
    worker.addEventListener("error", errorListener);

    worker.postMessage({ operation, payload });
  });
}

export function gitClone(repo: GitHubRepository, user: GitHubUser): Promise<string> {
  return createWorkerPromise<string>("gitClone", { repo, user });
}

export function gitPull(user: GitHubUser): Promise<string> {
  return createWorkerPromise<string>("gitPull", { user });
}

export function gitPush(user: GitHubUser): Promise<string> {
  return createWorkerPromise<string>("gitPush", { user });
}

export function gitAdd(filePaths: string[]): Promise<string> {
  return createWorkerPromise<string>("gitAdd", { filePaths });
}

export function gitRemove(filePath: string): Promise<string> {
  return createWorkerPromise<string>("gitRemove", { filePath });
}

export function gitCommit(message: string): Promise<string> {
  return createWorkerPromise<string>("gitCommit", { message });
}

export function isRepoSynced(): Promise<boolean> {
  return createWorkerPromise<boolean>("isRepoSynced", {});
}

export function getRemoteOriginUrl(): Promise<string> {
  return createWorkerPromise<string>("getRemoteOriginUrl", {});
}
