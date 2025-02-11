
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.voiceMode.starting:invocation[0]": { type: "done.invoke.voiceMode.starting:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "start": "done.invoke.voiceMode.starting:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "setContext": "done.invoke.voiceMode.starting:invocation[0]";
"stop": "STOP";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "start": "START";
        };
        matchesStates: "idle" | "listening" | "starting";
        tags: never;
      }
  