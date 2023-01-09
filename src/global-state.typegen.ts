// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  internalEvents: {
    "": { type: "" }
    "done.invoke.loadContext": {
      type: "done.invoke.loadContext"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "done.invoke.loadNotes": {
      type: "done.invoke.loadNotes"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "error.platform.loadContext": { type: "error.platform.loadContext"; data: unknown }
    "error.platform.loadNotes": { type: "error.platform.loadNotes"; data: unknown }
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {
    loadContext: "done.invoke.loadContext"
    loadNotes: "done.invoke.loadNotes"
  }
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    clearAuthToken: "SIGN_OUT" | "done.invoke.loadContext" | "error.platform.loadContext"
    clearAuthTokenInIndexedDB: "SIGN_OUT" | "done.invoke.loadContext" | "error.platform.loadContext"
    deleteNote: "DELETE_NOTE"
    deleteNoteFile: "DELETE_NOTE"
    saveContextInIndexedDB:
      | "DELETE_NOTE"
      | "SELECT_REPO"
      | "SIGN_IN"
      | "UPSERT_NOTE"
      | "done.invoke.loadNotes"
    setContext: "SELECT_REPO" | "SIGN_IN" | "done.invoke.loadContext" | "done.invoke.loadNotes"
    sortNoteIds: "DELETE_NOTE" | "UPSERT_NOTE" | "done.invoke.loadNotes"
    upsertNote: "UPSERT_NOTE"
    upsertNoteFile: "UPSERT_NOTE"
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    hasAuthToken: "done.invoke.loadContext"
    hasNoBacklinks: "DELETE_NOTE"
    hasRepo: ""
  }
  eventsCausingServices: {
    loadContext: "xstate.init"
    loadNotes: "" | "RELOAD_NOTES" | "SELECT_REPO"
  }
  matchesStates:
    | "loadingContext"
    | "signedIn"
    | "signedIn.idle"
    | "signedIn.initializing"
    | "signedIn.loadingNotes"
    | "signedIn.selectingRepo"
    | "signedOut"
    | { signedIn?: "idle" | "initializing" | "loadingNotes" | "selectingRepo" }
  tags: never
}
