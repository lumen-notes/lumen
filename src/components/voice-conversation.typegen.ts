
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
          "addTools": "ADD_TOOLS";
"alertError": "ERROR";
"executeToolCalls": "TOOL_CALLS";
"muteMicrophone": "MUTE_MIC";
"removeTools": "REMOVE_TOOLS";
"sendText": "SEND_TEXT";
"unmuteMicrophone": "UNMUTE_MIC";
        };
        eventsCausingDelays: {
          
        };
        eventsCausingGuards: {
          
        };
        eventsCausingServices: {
          "session": "START";
        };
        matchesStates: "active" | "active.initializing" | "active.ready" | "active.ready.assistant" | "active.ready.assistant.listening" | "active.ready.assistant.responding" | "active.ready.mic" | "active.ready.mic.muted" | "active.ready.mic.unmuted" | "inactive" | { "active"?: "initializing" | "ready" | { "ready"?: "assistant" | "mic" | { "assistant"?: "listening" | "responding";
"mic"?: "muted" | "unmuted"; }; }; };
        tags: never;
      }
  