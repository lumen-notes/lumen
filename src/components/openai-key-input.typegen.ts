
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.openaiKeyValidation.initializing:invocation[0]": { type: "done.invoke.openaiKeyValidation.initializing:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "initialize": "done.invoke.openaiKeyValidation.initializing:invocation[0]";
"validate": "done.invoke.openaiKeyValidation.validating:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          "isEmpty": "CHANGE" | "done.invoke.openaiKeyValidation.initializing:invocation[0]";
        };
        eventsCausingServices: {
          "initialize": "RESTART" | "xstate.init";
"validate": "CHANGE" | "done.invoke.openaiKeyValidation.initializing:invocation[0]";
        };
        matchesStates: "empty" | "initializing" | "invalid" | "valid" | "validating";
        tags: never;
      }
  