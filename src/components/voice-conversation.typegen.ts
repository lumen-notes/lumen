
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "error.platform.voiceConversation.starting:invocation[0]": { type: "error.platform.voiceConversation.starting:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "start": "done.invoke.voiceConversation.starting:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "stop": "STOP" | "error.platform.voiceConversation.starting:invocation[0]";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "start": "START";
        };
        matchesStates: "active" | "inactive" | "starting";
        tags: never;
      }
  