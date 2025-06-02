/* --------------------------------------------------------------------------
 * Main-thread helper for Git Web Worker
 * --------------------------------------------------------------------------
 * Usage example:
 *   import { gitRpc } from "./git"
 *   await gitRpc("clone", { dir: "/repo", url: "https://github.com/..." })
 * -------------------------------------------------------------------------- */

let seq = 0

// Instantiate the worker via Vite's `new URL` pattern so it works in both dev
// and production bundles.  The `{ type: 'module' }` flag ensures ESM in the
// worker, matching the source file.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – WebWorker types are injected by vite/client
const worker = new Worker(new URL("./gitWorker.js", import.meta.url), {
  type: "module",
})

export type GitCommand = Parameters<typeof worker.postMessage>[0] extends {
  cmd: infer C
}
  ? C & string
  : string

/**
 * Call an isomorphic-git command in the background thread.
 * @param cmd  – The function name on the `isomorphic-git` module (e.g. "clone")
 * @param args – Options object for that command, **without** the required `fs:`
 *               parameter (the worker injects it for you).
 */
export function gitRpc<T = unknown>(cmd: GitCommand, args: Record<string, unknown> = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = ++seq

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.id !== id) return
      worker.removeEventListener("message", handleMessage)
      const { result, error } = event.data
      if (error) {
        reject(new Error(error))
      } else {
        resolve(result as T)
      }
    }

    worker.addEventListener("message", handleMessage)
    worker.postMessage({ id, cmd, args })
  })
}