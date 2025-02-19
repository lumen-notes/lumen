
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
          "addToolsToContext": "ADD_TOOLS";
"alertError": "ERROR";
"executeToolCalls": "TOOL_CALLS";
"muteMicrophone": "MUTE_MIC";
"playReadySound": "SESSION_CREATED";
"removeToolsFromContext": "REMOVE_TOOLS";
"sendText": "SEND_TEXT";
"unmuteMicrophone": "UNMUTE_MIC";
"updateSessionWithTools": "ADD_TOOLS" | "REMOVE_TOOLS" | "SESSION_CREATED";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "session": "START";
        };
        matchesStates: "active" | "active.initializing" | "active.ready" | "active.ready.assistant" | "active.ready.assistant.listening" | "active.ready.assistant.responding" | "active.ready.mic" | "active.ready.mic.muted" | "active.ready.mic.unmuted" | "active.ready.user" | "active.ready.user.idle" | "active.ready.user.speaking" | "inactive" | { "active"?: "initializing" | "ready" | { "ready"?: "assistant" | "mic" | "user" | { "assistant"?: "listening" | "responding";
"mic"?: "muted" | "unmuted";
"user"?: "idle" | "speaking"; }; }; };
        tags: never;
      }
  