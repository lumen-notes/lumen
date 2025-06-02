/* eslint-disable no-restricted-globals */

// -----------------------------------------------------------------------------
// Git Web Worker – runs heavy isomorphic-git commands off the main thread.
// -----------------------------------------------------------------------------

// NOTE: this file is plain JavaScript because it will be instantiated directly
// by the browser as a Worker script.  It is still located inside `src/` so Vite
// can bundle it and make it available via `new URL('./gitWorker.js', import.meta.url)`.

import * as git from "isomorphic-git"
import LightningFS from "@isomorphic-git/lightning-fs"

// Create / open a persistent, IndexedDB-backed virtual file-system.  The name
// determines the DB key so changing it will wipe the repo.
const fs = new LightningFS("git-fs")
const pfs = fs.promises

// Every message from the main thread is expected to follow the shape:
//   { id: number, cmd: keyof typeof git, args: Record<string, unknown> }
// where `cmd` is the name of an isomorphic-git function, and `args` are the
// corresponding options *excluding* the required `fs:` parameter (injected here).
self.onmessage = async (event) => {
  const { id, cmd, args } = event.data || {}

  // Defensive guards so that random messages do not blow up the worker.
  if (typeof id !== "number" || typeof cmd !== "string" || !(cmd in git)) {
    self.postMessage({ id, error: "gitWorker: malformed request" })
    return
  }

  try {
    // @ts-ignore – dynamic access is fine in JS context.
    const result = await git[cmd]({ fs: pfs, ...args })
    // Transfer the result back.  Add ArrayBuffers as transferable for 0-copy.
    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error?.message || String(error) })
  }
}