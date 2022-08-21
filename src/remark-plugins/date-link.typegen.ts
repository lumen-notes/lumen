// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  internalEvents: {
    "": { type: "" }
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
    appendDay: "CHAR"
    appendMonth: "CHAR"
    appendYear: "CHAR"
    consume: "CHAR"
  }
  eventsCausingServices: {}
  eventsCausingGuards: {
    isClosingMarkerChar: "CHAR"
    isNumberChar: "CHAR"
    isOk:
      | "done.state.dateLink.dateLink"
      | "done.state.dateLink.dateLink.closingMarker"
      | "done.state.dateLink.dateLink.full"
      | "done.state.dateLink.dateLink.full.day"
      | "done.state.dateLink.dateLink.full.month"
      | "done.state.dateLink.dateLink.full.separator1"
      | "done.state.dateLink.dateLink.full.separator2"
      | "done.state.dateLink.dateLink.full.year"
      | "done.state.dateLink.dateLink.openingMarker"
    isOpeningMarkerChar: "CHAR"
    isSeparatorChar: "CHAR"
    isValidDate: ""
  }
  eventsCausingDelays: {}
  matchesStates:
    | "dateLink"
    | "dateLink.closingMarker"
    | "dateLink.closingMarker.1"
    | "dateLink.closingMarker.2"
    | "dateLink.closingMarker.nok"
    | "dateLink.closingMarker.ok"
    | "dateLink.full"
    | "dateLink.full.day"
    | "dateLink.full.day.1"
    | "dateLink.full.day.2"
    | "dateLink.full.day.nok"
    | "dateLink.full.day.ok"
    | "dateLink.full.month"
    | "dateLink.full.month.1"
    | "dateLink.full.month.2"
    | "dateLink.full.month.nok"
    | "dateLink.full.month.ok"
    | "dateLink.full.nok"
    | "dateLink.full.ok"
    | "dateLink.full.separator1"
    | "dateLink.full.separator1.1"
    | "dateLink.full.separator1.nok"
    | "dateLink.full.separator1.ok"
    | "dateLink.full.separator2"
    | "dateLink.full.separator2.1"
    | "dateLink.full.separator2.nok"
    | "dateLink.full.separator2.ok"
    | "dateLink.full.year"
    | "dateLink.full.year.1"
    | "dateLink.full.year.2"
    | "dateLink.full.year.3"
    | "dateLink.full.year.4"
    | "dateLink.full.year.nok"
    | "dateLink.full.year.ok"
    | "dateLink.nok"
    | "dateLink.ok"
    | "dateLink.openingMarker"
    | "dateLink.openingMarker.1"
    | "dateLink.openingMarker.2"
    | "dateLink.openingMarker.nok"
    | "dateLink.openingMarker.ok"
    | "dateLink.validateDate"
    | "ok"
    | {
        dateLink?:
          | "closingMarker"
          | "full"
          | "nok"
          | "ok"
          | "openingMarker"
          | "validateDate"
          | {
              closingMarker?: "1" | "2" | "nok" | "ok"
              full?:
                | "day"
                | "month"
                | "nok"
                | "ok"
                | "separator1"
                | "separator2"
                | "year"
                | {
                    day?: "1" | "2" | "nok" | "ok"
                    month?: "1" | "2" | "nok" | "ok"
                    separator1?: "1" | "nok" | "ok"
                    separator2?: "1" | "nok" | "ok"
                    year?: "1" | "2" | "3" | "4" | "nok" | "ok"
                  }
              openingMarker?: "1" | "2" | "nok" | "ok"
            }
      }
  tags: never
}
