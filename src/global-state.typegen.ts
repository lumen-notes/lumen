
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.loadContext": { type: "done.invoke.loadContext"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.pullNotes": { type: "done.invoke.pullNotes"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.pushNotes": { type: "done.invoke.pushNotes"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.loadContext": { type: "error.platform.loadContext"; data: unknown };
"error.platform.pullNotes": { type: "error.platform.pullNotes"; data: unknown };
"error.platform.pushNotes": { type: "error.platform.pushNotes"; data: unknown };
"xstate.init": { type: "xstate.init" };
"xstate.stop": { type: "xstate.stop" };
        };
        invokeSrcNameMap: {
          "loadContext": "done.invoke.loadContext";
"pullNotes": "done.invoke.pullNotes";
"pushNotes": "done.invoke.pushNotes";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "deleteNote": "DELETE_NOTE";
"saveContextInIndexedDB": "DELETE_NOTE" | "PULL_NOTES" | "PUSH_NOTES" | "SET_CONTEXT" | "UPSERT_NOTE" | "done.invoke.pullNotes" | "done.invoke.pushNotes" | "error.platform.loadContext" | "error.platform.pullNotes" | "error.platform.pushNotes" | "xstate.stop";
"setContext": "SET_CONTEXT" | "done.invoke.loadContext" | "done.invoke.pullNotes" | "done.invoke.pushNotes" | "error.platform.pullNotes" | "error.platform.pushNotes";
"sortNoteIds": "DELETE_NOTE" | "PULL_NOTES" | "PUSH_NOTES" | "SET_CONTEXT" | "UPSERT_NOTE" | "done.invoke.pullNotes" | "done.invoke.pushNotes" | "error.platform.loadContext" | "error.platform.pullNotes" | "error.platform.pushNotes" | "xstate.stop";
"upsertNote": "UPSERT_NOTE";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "hasNoBacklinks": "DELETE_NOTE";
        };
        eventsCausingServices: {
          "loadContext": "xstate.init";
"pullNotes": "PULL_NOTES" | "SET_CONTEXT" | "done.invoke.loadContext";
"pushNotes": "DELETE_NOTE" | "PUSH_NOTES" | "UPSERT_NOTE";
        };
        matchesStates: "idle" | "loadingContext" | "pullingNotes" | "pushingNotes";
        tags: never;
      }
  