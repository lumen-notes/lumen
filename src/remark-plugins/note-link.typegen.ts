// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
    "xstate.stop": { type: "xstate.stop" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: "exitNoteLink" | "consume" | "enterNoteLink"
    services: never
    guards: never
    delays: never
  }
  eventsCausingActions: {
    consume: "CHAR"
    enterNoteLink: "xstate.init"
    exitNoteLink: "CHAR" | "done.state.noteLink.noteLink" | "xstate.stop"
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates:
    | "nok"
    | "noteLink"
    | "noteLink.1"
    | "noteLink.done"
    | "ok"
    | { noteLink?: "1" | "done" }
  tags: never
}
