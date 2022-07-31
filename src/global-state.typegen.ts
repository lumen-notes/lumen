// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.loadContext": {
      type: "done.invoke.loadContext";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.showDirectoryPicker": {
      type: "done.invoke.showDirectoryPicker";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loadNotes": {
      type: "done.invoke.loadNotes";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.loadContext": {
      type: "error.platform.loadContext";
      data: unknown;
    };
    "done.invoke.queryPermission": {
      type: "done.invoke.queryPermission";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.queryPermission": {
      type: "error.platform.queryPermission";
      data: unknown;
    };
    "error.platform.requestPermission": {
      type: "error.platform.requestPermission";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
    "done.invoke.requestPermission": {
      type: "done.invoke.requestPermission";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.showDirectoryPicker": {
      type: "error.platform.showDirectoryPicker";
      data: unknown;
    };
    "error.platform.loadNotes": {
      type: "error.platform.loadNotes";
      data: unknown;
    };
  };
  invokeSrcNameMap: {
    loadContext: "done.invoke.loadContext";
    queryPermission: "done.invoke.queryPermission";
    requestPermission: "done.invoke.requestPermission";
    showDirectoryPicker: "done.invoke.showDirectoryPicker";
    loadNotes: "done.invoke.loadNotes";
  };
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    setContext: "done.invoke.loadContext";
    setDirectoryHandle: "done.invoke.showDirectoryPicker";
    setNotes: "done.invoke.loadNotes";
    setContextInIndexedDB:
      | "done.invoke.loadNotes"
      | "UPSERT_NOTE"
      | "DELETE_NOTE";
    upsertNote: "UPSERT_NOTE";
    upsertNoteFile: "UPSERT_NOTE";
    deleteNote: "DELETE_NOTE";
    deleteNoteFile: "DELETE_NOTE";
    clearContext:
      | "error.platform.loadContext"
      | "done.invoke.queryPermission"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "DISCONNECT";
    clearContextInIndexedDB:
      | "error.platform.loadContext"
      | "done.invoke.queryPermission"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "DISCONNECT";
  };
  eventsCausingServices: {
    loadContext: "xstate.init";
    queryPermission: "done.invoke.loadContext" | "RELOAD";
    requestPermission: "REQUEST_PERMISSION";
    showDirectoryPicker: "SHOW_DIRECTORY_PICKER";
    loadNotes:
      | "done.invoke.queryPermission"
      | "done.invoke.requestPermission"
      | "done.invoke.showDirectoryPicker";
  };
  eventsCausingGuards: {
    isGranted: "done.invoke.queryPermission";
    isPrompt: "done.invoke.queryPermission";
    isDenied: "done.invoke.queryPermission";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "loadingContext"
    | "queryingPermission"
    | "empty"
    | "prompt"
    | "requestingPermission"
    | "showingDirectoryPicker"
    | "loadingNotes"
    | "ready";
  tags: never;
}
