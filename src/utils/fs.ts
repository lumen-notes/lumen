import LightningFS from "@isomorphic-git/lightning-fs"

const DB_NAME = "fs"

// TODO: Investigate memfs + OPFS as a more performant alternative to lightning-fs + IndexedDB
// Reference: https://github.com/streamich/memfs/tree/c8bfa38aa15f1d3c9f326e9c25c8972326193a26/demo/git-opfs
export const fs = new LightningFS(DB_NAME)

/** Delete file system database */
export function fsWipe() {
  window.indexedDB.deleteDatabase(DB_NAME)
}
