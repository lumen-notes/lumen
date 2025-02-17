
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "xstate.init": { type: "xstate.init" };
        };
        invokeSrcNameMap: {
          "session": "done.invoke.voiceConversation.active:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "alertError": "ERROR";
"muteMicrophone": "MUTE_MICROPHONE";
"sendText": "SEND_TEXT";
"unmuteMicrophone": "UNMUTE_MICROPHONE";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "session": "START";
        };
        matchesStates: "active" | "active.initializing" | "active.ready" | "active.ready.muted" | "active.ready.unmuted" | "inactive" | { "active"?: "initializing" | "ready" | { "ready"?: "muted" | "unmuted"; }; };
        tags: never;
      }
  