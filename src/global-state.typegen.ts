
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.global.initializingGitHubUser:invocation[0]": { type: "done.invoke.global.initializingGitHubUser:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "initGitHubUser": "done.invoke.global.initializingGitHubUser:invocation[0]";
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
"setGitHubUser": "SIGN_IN" | "done.invoke.global.initializingGitHubUser:invocation[0]";
"setGitHubUserLocalStorage": "SIGN_IN";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "initGitHubUser": "xstate.init";
        };
        matchesStates: "initializingGitHubUser" | "signedIn" | "signedOut";
        tags: never;
      }
  