
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "": { type: "" };
"done.invoke.global.resolvingUser:invocation[0]": { type: "done.invoke.global.resolvingUser:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloned.sync.checkingStatus:invocation[0]": { type: "done.invoke.global.signedIn.cloned.sync.checkingStatus:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]": { type: "done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloned.sync.pushing:invocation[0]": { type: "done.invoke.global.signedIn.cloned.sync.pushing:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloningRepo:invocation[0]": { type: "done.invoke.global.signedIn.cloningRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.resolvingRepo:invocation[0]": { type: "done.invoke.global.signedIn.resolvingRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.global.resolvingUser:invocation[0]": { type: "error.platform.global.resolvingUser:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]": { type: "error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.change.writingFiles:invocation[0]": { type: "error.platform.global.signedIn.cloned.change.writingFiles:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.sync.checkingStatus:invocation[0]": { type: "error.platform.global.signedIn.cloned.sync.checkingStatus:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.sync.pulling:invocation[0]": { type: "error.platform.global.signedIn.cloned.sync.pulling:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.sync.pushing:invocation[0]": { type: "error.platform.global.signedIn.cloned.sync.pushing:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloningRepo:invocation[0]": { type: "error.platform.global.signedIn.cloningRepo:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "checkStatus": "done.invoke.global.signedIn.cloned.sync.checkingStatus:invocation[0]";
"cloneRepo": "done.invoke.global.signedIn.cloningRepo:invocation[0]";
"deleteFile": "done.invoke.global.signedIn.cloned.change.deletingFile:invocation[0]";
"pull": "done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]";
"push": "done.invoke.global.signedIn.cloned.sync.pushing:invocation[0]";
"resolveRepo": "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"resolveUser": "done.invoke.global.resolvingUser:invocation[0]";
"writeFiles": "done.invoke.global.signedIn.cloned.change.writingFiles:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "clearGitHubRepo": "error.platform.global.signedIn.cloningRepo:invocation[0]";
"clearGitHubUser": "SIGN_OUT" | "error.platform.global.resolvingUser:invocation[0]";
"clearGitHubUserLocalStorage": "SIGN_OUT" | "error.platform.global.resolvingUser:invocation[0]";
"clearMarkdownFiles": "SELECT_REPO";
"clearMarkdownFilesLocalStorage": "SELECT_REPO";
"deleteMarkdownFile": "DELETE_FILE";
"deleteMarkdownFileLocalStorage": "DELETE_FILE";
"logError": "error.platform.global.signedIn.cloned.sync.checkingStatus:invocation[0]" | "error.platform.global.signedIn.cloned.sync.pulling:invocation[0]" | "error.platform.global.signedIn.cloned.sync.pushing:invocation[0]";
"mergeMarkdownFiles": "WRITE_FILES";
"mergeMarkdownFilesLocalStorage": "WRITE_FILES";
"setError": "error.platform.global.signedIn.cloned.change.deletingFile:invocation[0]" | "error.platform.global.signedIn.cloned.change.writingFiles:invocation[0]" | "error.platform.global.signedIn.cloningRepo:invocation[0]";
"setGitHubRepo": "SELECT_REPO" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"setGitHubUser": "SIGN_IN" | "done.invoke.global.resolvingUser:invocation[0]";
"setMarkdownFiles": "done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"setMarkdownFilesLocalStorage": "done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isOffline": "";
"isSynced": "done.invoke.global.signedIn.cloned.sync.checkingStatus:invocation[0]";
        };
        eventsCausingServices: {
          "checkStatus": "done.invoke.global.signedIn.cloned.sync.pushing:invocation[0]";
"cloneRepo": "SELECT_REPO";
"deleteFile": "DELETE_FILE";
"pull": "SYNC" | "done.invoke.global.signedIn.cloned.sync.checkingStatus:invocation[0]" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"push": "done.invoke.global.signedIn.cloned.sync.pulling:invocation[0]";
"resolveRepo": "SIGN_IN" | "done.invoke.global.resolvingUser:invocation[0]";
"resolveUser": "xstate.init";
"writeFiles": "WRITE_FILES";
        };
        matchesStates: "resolvingUser" | "signedIn" | "signedIn.cloned" | "signedIn.cloned.change" | "signedIn.cloned.change.deletingFile" | "signedIn.cloned.change.idle" | "signedIn.cloned.change.writingFiles" | "signedIn.cloned.sync" | "signedIn.cloned.sync.checkingStatus" | "signedIn.cloned.sync.error" | "signedIn.cloned.sync.pulling" | "signedIn.cloned.sync.pushing" | "signedIn.cloned.sync.success" | "signedIn.cloningRepo" | "signedIn.empty" | "signedIn.resolvingRepo" | "signedOut" | { "signedIn"?: "cloned" | "cloningRepo" | "empty" | "resolvingRepo" | { "cloned"?: "change" | "sync" | { "change"?: "deletingFile" | "idle" | "writingFiles";
"sync"?: "checkingStatus" | "error" | "pulling" | "pushing" | "success"; }; }; };
        tags: never;
      }
  