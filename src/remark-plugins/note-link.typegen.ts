// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
    "xstate.stop": { type: "xstate.stop" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: "consume"
    services: never
    guards: never
    delays: never
  }
  eventsCausingActions: {
    consume: "CHAR"
  }
  eventsCausingServices: {}
  eventsCausingGuards: {
    isOpeningMarkerChar: "CHAR"
  }
  eventsCausingDelays: {}
  matchesStates:
    | "nok"
    | "noteLink"
    | "noteLink.1"
    | "noteLink.2"
    | "noteLink.done"
    | "ok"
    | { noteLink?: "1" | "2" | "done" }
  tags: never
}
