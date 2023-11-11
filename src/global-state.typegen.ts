
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.global.resolvingUser:invocation[0]": { type: "done.invoke.global.resolvingUser:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]": { type: "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloningRepo:invocation[0]": { type: "done.invoke.global.signedIn.cloningRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.resolvingRepo:invocation[0]": { type: "done.invoke.global.signedIn.resolvingRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.global.resolvingUser:invocation[0]": { type: "error.platform.global.resolvingUser:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.sync.syncing:invocation[0]": { type: "error.platform.global.signedIn.cloned.sync.syncing:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloned.write.writingFile:invocation[0]": { type: "error.platform.global.signedIn.cloned.write.writingFile:invocation[0]"; data: unknown };
"error.platform.global.signedIn.cloningRepo:invocation[0]": { type: "error.platform.global.signedIn.cloningRepo:invocation[0]"; data: unknown };
"error.platform.global.signedIn.resolvingRepo:invocation[0]": { type: "error.platform.global.signedIn.resolvingRepo:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "cloneRepo": "done.invoke.global.signedIn.cloningRepo:invocation[0]";
"resolveRepo": "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"resolveUser": "done.invoke.global.resolvingUser:invocation[0]";
"sync": "done.invoke.global.signedIn.cloned.sync.syncing:invocation[0]";
"writeFile": "done.invoke.global.signedIn.cloned.write.writingFile:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "clearGitHubUser": "SIGN_OUT" | "error.platform.global.resolvingUser:invocation[0]";
"setError": "error.platform.global.signedIn.cloned.sync.syncing:invocation[0]" | "error.platform.global.signedIn.cloned.write.writingFile:invocation[0]" | "error.platform.global.signedIn.cloningRepo:invocation[0]" | "error.platform.global.signedIn.resolvingRepo:invocation[0]";
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
          
        };
        eventsCausingServices: {
          "cloneRepo": "SELECT_REPO";
"resolveRepo": "SIGN_IN" | "done.invoke.global.resolvingUser:invocation[0]";
"resolveUser": "xstate.init";
"sync": "SYNC" | "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.resolvingRepo:invocation[0]";
"writeFile": "WRITE_FILE";
        };
        matchesStates: "resolvingUser" | "signedIn" | "signedIn.cloned" | "signedIn.cloned.sync" | "signedIn.cloned.sync.idle" | "signedIn.cloned.sync.syncing" | "signedIn.cloned.write" | "signedIn.cloned.write.idle" | "signedIn.cloned.write.writingFile" | "signedIn.cloningRepo" | "signedIn.empty" | "signedIn.resolvingRepo" | "signedOut" | { "signedIn"?: "cloned" | "cloningRepo" | "empty" | "resolvingRepo" | { "cloned"?: "sync" | "write" | { "sync"?: "idle" | "syncing";
"write"?: "idle" | "writingFile"; }; }; };
        tags: never;
      }
  