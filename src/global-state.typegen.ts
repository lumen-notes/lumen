
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.global.resolvingUser:invocation[0]": { type: "done.invoke.global.resolvingUser:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]": { type: "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloningRepo:invocation[0]": { type: "done.invoke.global.signedIn.cloningRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.resolvingRepo:invocation[0]": { type: "done.invoke.global.signedIn.resolvingRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.global.resolvingUser:invocation[0]": { type: "error.platform.global.resolvingUser:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]": { type: "error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.change.writingFile:invocation[0]": { type: "error.platform.global.signedIn.cloned.change.writingFile:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.sync.syncing:invocation[0]": { type: "error.platform.global.signedIn.cloned.sync.syncing:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloningRepo:invocation[0]": { type: "error.platform.global.signedIn.cloningRepo:invocation[0]"; data: unknown };
"error.platform.global.signedIn.resolvingRepo:invocation[0]": { type: "error.platform.global.signedIn.resolvingRepo:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "cloneRepo": "done.invoke.global.signedIn.cloningRepo:invocation[0]";
"deleteFile": "done.invoke.global.signedIn.cloned.change.deletingFile:invocation[0]";
"resolveRepo": "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"resolveUser": "done.invoke.global.resolvingUser:invocation[0]";
"sync": "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]";
"writeFile": "done.invoke.global.signedIn.cloned.change.writingFile:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "clearGitHubUser": "SIGN_OUT" | "error.platform.global.resolvingUser:invocation[0]";
"clearGitHubUserLocalStorage": "SIGN_OUT" | "error.platform.global.resolvingUser:invocation[0]";
"deleteMarkdownFile": "DELETE_FILE";
"deleteMarkdownFileLocalStorage": "DELETE_FILE";
"setError": "error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]" | "error.platform.global.signedIn.cloned.change.writingFile:invocation[0]" | "error.platform.global.signedIn.cloned.sync.syncing:invocation[0]" | "error.platform.global.signedIn.cloningRepo:invocation[0]" | "error.platform.global.signedIn.resolvingRepo:invocation[0]";
"setGitHubRepo": "SELECT_REPO" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"setGitHubUser": "SIGN_IN" | "done.invoke.global.resolvingUser:invocation[0]";
"setMarkdownFile": "WRITE_FILE";
"setMarkdownFileLocalStorage": "WRITE_FILE";
"setMarkdownFiles": "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"setMarkdownFilesLocalStorage": "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isOffline": "";
        };
        eventsCausingServices: {
          "cloneRepo": "SELECT_REPO";
"deleteFile": "DELETE_FILE";
"resolveRepo": "SIGN_IN" | "done.invoke.global.resolvingUser:invocation[0]";
"resolveUser": "xstate.init";
"sync": "SYNC" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"writeFile": "WRITE_FILE";
        };
        matchesStates: "resolvingUser" | "signedIn" | "signedIn.cloned" | "signedIn.cloned.change" | "signedIn.cloned.change.deletingFile" | "signedIn.cloned.change.idle" | "signedIn.cloned.change.writingFile" | "signedIn.cloned.sync" | "signedIn.cloned.sync.idle" | "signedIn.cloned.sync.syncing" | "signedIn.cloningRepo" | "signedIn.empty" | "signedIn.resolvingRepo" | "signedOut" | { "signedIn"?: "cloned" | "cloningRepo" | "empty" | "resolvingRepo" | { "cloned"?: "change" | "sync" | { "change"?: "deletingFile" | "idle" | "writingFile";
"sync"?: "idle" | "syncing"; }; }; };
        tags: never;
      }
  