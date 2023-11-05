
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.global.initializingGitHubUser:invocation[0]": { type: "done.invoke.global.initializingGitHubUser:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.cloningRepo:invocation[0]": { type: "done.invoke.global.signedIn.cloningRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]": { type: "done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.loadingFiles:invocation[0]": { type: "done.invoke.global.signedIn.loadingFiles:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.syncing.pulling:invocation[0]": { type: "done.invoke.global.signedIn.syncing.pulling:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.global.signedIn.writingFile:invocation[0]": { type: "done.invoke.global.signedIn.writingFile:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.global.signedIn.cloningRepo:invocation[0]": { type: "error.platform.global.signedIn.cloningRepo:invocation[0]"; data: unknown };
"error.platform.global.signedIn.loadingFiles:invocation[0]": { type: "error.platform.global.signedIn.loadingFiles:invocation[0]"; data: unknown };
"error.platform.global.signedIn.writingFile:invocation[0]": { type: "error.platform.global.signedIn.writingFile:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "cloneRepo": "done.invoke.global.signedIn.cloningRepo:invocation[0]";
"initGitHubRepo": "done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]";
"initGitHubUser": "done.invoke.global.initializingGitHubUser:invocation[0]";
"loadFiles": "done.invoke.global.signedIn.loadingFiles:invocation[0]";
"pullFromGitHub": "done.invoke.global.signedIn.syncing.pulling:invocation[0]";
"pushToGitHub": "done.invoke.global.signedIn.syncing.pushing:invocation[0]";
"writeFile": "done.invoke.global.signedIn.writingFile:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "clearGitHubUser": "SIGN_OUT";
"clearGitHubUserLocalStorage": "SIGN_OUT";
"setError": "error.platform.global.signedIn.cloningRepo:invocation[0]" | "error.platform.global.signedIn.loadingFiles:invocation[0]" | "error.platform.global.signedIn.writingFile:invocation[0]";
"setGitHubRepo": "SELECT_REPO" | "done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]";
"setGitHubUser": "SIGN_IN" | "done.invoke.global.initializingGitHubUser:invocation[0]";
"setGitHubUserLocalStorage": "SIGN_IN";
"setMarkdownFile": "WRITE_FILE";
"setMarkdownFiles": "done.invoke.global.signedIn.loadingFiles:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isOnline": "done.invoke.global.signedIn.writingFile:invocation[0]";
        };
        eventsCausingServices: {
          "cloneRepo": "SELECT_REPO";
"initGitHubRepo": "SIGN_IN" | "done.invoke.global.initializingGitHubUser:invocation[0]";
"initGitHubUser": "xstate.init";
"loadFiles": "done.invoke.global.signedIn.cloningRepo:invocation[0]" | "done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]" | "done.state.global.signedIn.syncing";
"pullFromGitHub": "SYNC" | "done.invoke.global.signedIn.writingFile:invocation[0]";
"pushToGitHub": "done.invoke.global.signedIn.syncing.pulling:invocation[0]";
"writeFile": "WRITE_FILE";
        };
        matchesStates: "initializingGitHubUser" | "signedIn" | "signedIn.cloningRepo" | "signedIn.empty" | "signedIn.error" | "signedIn.idle" | "signedIn.initializingGitHubRepo" | "signedIn.loadingFiles" | "signedIn.syncing" | "signedIn.syncing.pulling" | "signedIn.syncing.pushing" | "signedIn.writingFile" | "signedOut" | { "signedIn"?: "cloningRepo" | "empty" | "error" | "idle" | "initializingGitHubRepo" | "loadingFiles" | "syncing" | "writingFile" | { "syncing"?: "pulling" | "pushing"; }; };
        tags: never;
      }
  