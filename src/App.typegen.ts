// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  eventsCausingActions: {
    setContext: "done.invoke.loadContext";
    saveContext: "done.invoke.loadContext" | "done.invoke.loadNotes";
    setDirectoryHandle: "done.invoke.showDirectoryPicker";
    setNotes: "done.invoke.loadNotes";
    clearContext:
      | "error.platform.loadContext"
      | "done.invoke.queryPermission"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "CLOSE";
    unsaveContext:
      | "error.platform.loadContext"
      | "done.invoke.queryPermission"
      | "error.platform.queryPermission"
      | "error.platform.requestPermission"
      | "CLOSE";
  };
  internalEvents: {
    "done.invoke.loadContext": {
      type: "done.invoke.loadContext";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loadNotes": {
      type: "done.invoke.loadNotes";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.showDirectoryPicker": {
      type: "done.invoke.showDirectoryPicker";
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
    "done.invoke.requestPermission": {
      type: "done.invoke.requestPermission";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
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
  eventsCausingServices: {
    loadContext: "xstate.init";
    queryPermission: "done.invoke.loadContext" | "RELOAD";
    loadNotes:
      | "done.invoke.queryPermission"
      | "done.invoke.requestPermission"
      | "done.invoke.showDirectoryPicker";
    showDirectoryPicker: "SHOW_DIRECTORY_PICKER";
    requestPermission: "REQUEST_PERMISSION";
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
