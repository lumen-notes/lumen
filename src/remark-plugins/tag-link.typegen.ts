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
    forwardChar: "CHAR"
  }
  eventsCausingServices: {}
  eventsCausingGuards: {
    isAlphaChar: "CHAR"
    isMarkerChar: "CHAR"
    isNameChar: "CHAR"
    isOk:
      | "done.state.tagLink.tagLink"
      | "done.state.tagLink.tagLink.marker"
      | "done.state.tagLink.tagLink.name"
  }
  eventsCausingDelays: {}
  matchesStates:
    | "ok"
    | "tagLink"
    | "tagLink.marker"
    | "tagLink.marker.1"
    | "tagLink.marker.nok"
    | "tagLink.marker.ok"
    | "tagLink.name"
    | "tagLink.name.1"
    | "tagLink.name.2"
    | "tagLink.name.nok"
    | "tagLink.name.ok"
    | "tagLink.nok"
    | "tagLink.ok"
    | {
        tagLink?:
          | "marker"
          | "name"
          | "nok"
          | "ok"
          | { marker?: "1" | "nok" | "ok"; name?: "1" | "2" | "nok" | "ok" }
      }
  tags: never
}
