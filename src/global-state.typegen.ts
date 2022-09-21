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
    "done.invoke.queryPermission": {
      type: "done.invoke.queryPermission"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "done.invoke.requestPermission": {
      type: "done.invoke.requestPermission"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "done.invoke.showDirectoryPicker": {
      type: "done.invoke.showDirectoryPicker"
      data: unknown
      __tip: "See the XState TS docs to learn how to strongly type this."
    }
    "error.platform.loadContext": { type: "error.platform.loadContext"; data: unknown }
    "error.platform.loadNotes": { type: "error.platform.loadNotes"; data: unknown }
    "error.platform.queryPermission": { type: "error.platform.queryPermission"; data: unknown }
    "error.platform.requestPermission": { type: "error.platform.requestPermission"; data: unknown }
    "error.platform.showDirectoryPicker": {
      type: "error.platform.showDirectoryPicker"
      data: unknown
    }
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {
    loadContext: "done.invoke.loadContext"
    loadNotes: "done.invoke.loadNotes"
    queryPermission: "done.invoke.queryPermission"
    requestPermission: "done.invoke.requestPermission"
    showDirectoryPicker: "done.invoke.showDirectoryPicker"
  }
  missingImplementations: {
    actions: never
    services: never
    guards: never
    delays: never
  }
  eventsCausingActions: {
    clearContext:
      | "DISCONNECT"
      | "PERMISSION_DENIED"
      | "done.invoke.queryPermission"
      | "error.platform.loadContext"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "error.platform.showDirectoryPicker"
    clearContextInIndexedDB:
      | "DISCONNECT"
      | "PERMISSION_DENIED"
      | "done.invoke.queryPermission"
      | "error.platform.loadContext"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "error.platform.showDirectoryPicker"
    deleteNote: "DELETE_NOTE"
    deleteNoteFile: "DELETE_NOTE"
    setContext:
      | "done.invoke.loadContext"
      | "done.invoke.loadNotes"
      | "done.invoke.showDirectoryPicker"
    setContextInIndexedDB: "DELETE_NOTE" | "UPSERT_NOTE" | "done.invoke.loadNotes"
    uploadFile: "UPLOAD_FILE"
    upsertNote: "UPSERT_NOTE"
    upsertNoteFile: "UPSERT_NOTE"
  }
  eventsCausingServices: {
    loadContext: ""
    loadNotes:
      | "done.invoke.queryPermission"
      | "done.invoke.requestPermission"
      | "done.invoke.showDirectoryPicker"
    queryPermission: "RELOAD" | "done.invoke.loadContext"
    requestPermission: "REQUEST_PERMISSION"
    showDirectoryPicker: "SHOW_DIRECTORY_PICKER"
  }
  eventsCausingGuards: {
    isDenied: "done.invoke.queryPermission"
    isGranted: "done.invoke.queryPermission"
    isPrompt: "done.invoke.queryPermission"
    isSupported: ""
  }
  eventsCausingDelays: {}
  matchesStates:
    | "connected"
    | "connected.idle"
    | "connected.loadingNotes"
    | "disconnected"
    | "initial"
    | "loadingContext"
    | "notSupported"
    | "prompt"
    | "queryingPermission"
    | "requestingPermission"
    | "showingDirectoryPicker"
    | { connected?: "idle" | "loadingNotes" }
  tags: never
}
