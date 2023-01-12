
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.loadContext": { type: "done.invoke.loadContext"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.syncNotes": { type: "done.invoke.syncNotes"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.loadContext": { type: "error.platform.loadContext"; data: unknown };
"error.platform.syncNotes": { type: "error.platform.syncNotes"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "loadContext": "done.invoke.loadContext";
"syncNotes": "done.invoke.syncNotes";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "deleteNote": "DELETE_NOTE";
"saveContextInIndexedDB": "done.invoke.syncNotes" | "error.platform.loadContext" | "error.platform.syncNotes";
"setContext": "done.invoke.loadContext" | "done.invoke.syncNotes" | "error.platform.syncNotes";
"sortNoteIds": "DELETE_NOTE" | "UPSERT_NOTE" | "done.invoke.syncNotes" | "error.platform.loadContext" | "error.platform.syncNotes";
"upsertNote": "UPSERT_NOTE";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "hasNoBacklinks": "DELETE_NOTE";
        };
        eventsCausingServices: {
          "loadContext": "xstate.init";
"syncNotes": "DELETE_NOTE" | "SYNC_NOTES" | "UPSERT_NOTE" | "done.invoke.loadContext";
        };
        matchesStates: "idle" | "loadingContext" | "syncingNotes";
        tags: never;
      }
  