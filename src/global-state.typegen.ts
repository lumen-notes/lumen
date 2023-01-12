// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  internalEvents: {
    "done.invoke.loadContext": {
      type: "done.invoke.loadContext"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "error.platform.loadContext": { type: "error.platform.loadContext"; data: unknown }
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {
    loadContext: "done.invoke.loadContext"
  }
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    deleteNote: "DELETE_NOTE"
    saveContextInIndexedDB:
      | "DELETE_NOTE"
      | "UPSERT_NOTE"
      | "done.invoke.loadContext"
      | "error.platform.loadContext"
    setContext: "done.invoke.loadContext"
    sortNoteIds:
      | "DELETE_NOTE"
      | "UPSERT_NOTE"
      | "done.invoke.loadContext"
      | "error.platform.loadContext"
    upsertNote: "UPSERT_NOTE"
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    hasNoBacklinks: "DELETE_NOTE"
  }
  eventsCausingServices: {
    loadContext: "xstate.init"
  }
  matchesStates: "idle" | "loadingContext"
  tags: never
}
