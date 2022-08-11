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
    isClosingMarkerChar: "CHAR"
    isNumberChar: "CHAR"
    isOk:
      | "done.state.noteLink.noteLink"
      | "done.state.noteLink.noteLink.closingMarker"
      | "done.state.noteLink.noteLink.id"
      | "done.state.noteLink.noteLink.openingMarker"
      | "done.state.noteLink.noteLink.separator"
      | "done.state.noteLink.noteLink.text"
    isOpeningMarkerChar: "CHAR"
    isSeparatorChar: "CHAR"
    isTextChar: "CHAR"
  }
  eventsCausingDelays: {}
  matchesStates:
    | "noteLink"
    | "noteLink.checkNextChar"
    | "noteLink.closingMarker"
    | "noteLink.closingMarker.1"
    | "noteLink.closingMarker.2"
    | "noteLink.closingMarker.nok"
    | "noteLink.closingMarker.ok"
    | "noteLink.id"
    | "noteLink.id.1"
    | "noteLink.id.2"
    | "noteLink.id.nok"
    | "noteLink.id.ok"
    | "noteLink.nok"
    | "noteLink.ok"
    | "noteLink.openingMarker"
    | "noteLink.openingMarker.1"
    | "noteLink.openingMarker.2"
    | "noteLink.openingMarker.nok"
    | "noteLink.openingMarker.ok"
    | "noteLink.separator"
    | "noteLink.separator.1"
    | "noteLink.separator.nok"
    | "noteLink.separator.ok"
    | "noteLink.text"
    | "noteLink.text.1"
    | "noteLink.text.2"
    | "noteLink.text.nok"
    | "noteLink.text.ok"
    | "ok"
    | {
        noteLink?:
          | "checkNextChar"
          | "closingMarker"
          | "id"
          | "nok"
          | "ok"
          | "openingMarker"
          | "separator"
          | "text"
          | {
              closingMarker?: "1" | "2" | "nok" | "ok"
              id?: "1" | "2" | "nok" | "ok"
              openingMarker?: "1" | "2" | "nok" | "ok"
              separator?: "1" | "nok" | "ok"
              text?: "1" | "2" | "nok" | "ok"
            }
      }
  tags: never
}
