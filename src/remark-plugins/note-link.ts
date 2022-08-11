import { codes } from "micromark-util-symbol/codes"
import {
  Code,
  Construct,
  Extension,
  HtmlExtension,
  State,
  Tokenizer,
} from "micromark-util-types"
import { createMachine, interpret, send } from "xstate"

const types = {
  noteLink: "noteLink",
  noteLinkMarker: "noteLinkMarker",
  noteLinkId: "noteLinkId",
}

const noteLinkMachine = createMachine(
  {
    tsTypes: {} as import("./note-link.typegen").Typegen0,
    schema: { events: {} as { type: "CHAR"; code: Code } },
    id: "noteLink",
    initial: "noteLink",
    states: {
      noteLink: {
        entry: {
          type: "enter",
          tokenType: types.noteLink,
        },
        exit: {
          type: "exit",
          tokenType: types.noteLink,
        },
        initial: "openingMarker",
        states: {
          openingMarker: {
            entry: {
              type: "enter",
              tokenType: types.noteLinkMarker,
            },
            exit: {
              type: "exit",
              tokenType: types.noteLinkMarker,
            },
            initial: "1",
            states: {
              "1": {
                on: {
                  CHAR: [
                    {
                      cond: "isOpeningMarkerChar",
                      actions: "consume",
                      target: "2",
                    },
                    {
                      target: "nok",
                    },
                  ],
                },
              },
              2: {
                on: {
                  CHAR: [
                    {
                      cond: "isOpeningMarkerChar",
                      actions: "consume",
                      target: "ok",
                    },
                    {
                      target: "nok",
                    },
                  ],
                },
              },
              ok: {
                type: "final",
              },
              nok: {
                type: "final",
              },
            },
            onDone: [
              {
                cond: "isOk",
                target: "id",
              },
            ],
          },
          id: {
            entry: {
              type: "enter",
              tokenType: types.noteLinkId,
            },
            exit: {
              type: "exit",
              tokenType: types.noteLinkId,
            },
            initial: "1",
            states: {
              "1": {
                on: {
                  CHAR: [
                    {
                      cond: "isNumberChar",
                      actions: "consume",
                      target: "2",
                    },
                    {
                      target: "nok",
                    },
                  ],
                },
              },
              2: {
                on: {
                  CHAR: [
                    {
                      cond: "isNumberChar",
                      actions: "consume",
                    },
                    {
                      actions: "forwardChar",
                      target: "ok",
                    },
                  ],
                },
              },
              ok: {
                type: "final",
              },
              nok: {
                type: "final",
              },
            },
            onDone: [
              {
                cond: "isOk",
                target: "closingMarker",
              },
            ],
          },
          closingMarker: {
            entry: {
              type: "enter",
              tokenType: types.noteLinkMarker,
            },
            exit: {
              type: "exit",
              tokenType: types.noteLinkMarker,
            },
            initial: "1",
            states: {
              "1": {
                on: {
                  CHAR: [
                    {
                      cond: "isClosingMarkerChar",
                      actions: "consume",
                      target: "2",
                    },
                    {
                      target: "nok",
                    },
                  ],
                },
              },
              2: {
                on: {
                  CHAR: [
                    {
                      cond: "isClosingMarkerChar",
                      actions: "consume",
                      target: "ok",
                    },
                    {
                      target: "nok",
                    },
                  ],
                },
              },
              ok: {
                type: "final",
              },
              nok: {
                type: "final",
              },
            },
            onDone: [
              {
                cond: "isOk",
                target: "ok",
              },
            ],
          },
          ok: {
            type: "final",
          },
        },
        onDone: [
          {
            cond: "isOk",
            target: "ok",
          },
        ],
      },
      ok: {
        type: "final",
      },
    },
  },
  {
    guards: {
      isOk: (context, event, { state }) => {
        return state.toStrings().some((s) => /\.ok$/.test(s))
      },
      isOpeningMarkerChar: (context, event) => {
        return event.code === codes.leftSquareBracket
      },
      isClosingMarkerChar: (context, event) => {
        return event.code === codes.rightSquareBracket
      },
      isNumberChar: (context, event) => {
        if (event.code === null) return false
        return event.code >= codes.digit0 && event.code <= codes.digit9
      },
    },
    actions: {
      forwardChar: send((context, event) => ({
        type: "CHAR",
        code: event.code,
      })),
    },
  },
)

// Syntax extension
export function noteLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    const service = interpret(
      noteLinkMachine.withConfig({
        actions: {
          consume: (context, event) => {
            // console.log("consume", String.fromCharCode(Number(event.code)))
            effects.consume(event.code)
          },
          // @ts-ignore XState typegen doesn't detect actions with metadata
          enter: (context, event, { action }) => {
            // console.log("enter", action.tokenType)
            effects.enter(action.tokenType)
          },
          // @ts-ignore XState typegen doesn't detect actions with metadata
          exit: (context, event, { action }) => {
            // console.log("exit", action.tokenType)
            effects.exit(action.tokenType)
          },
        },
      }),
    )

    service.start()

    function nextState(code: Code): State | void {
      service.send({ type: "CHAR", code })

      if (service.state.value === "ok") {
        return ok(code)
      }

      if (service.state.toStrings().some((s) => /nok$/.test(s))) {
        console.log("nok")
        return nok(code)
      }

      return nextState
    }

    return nextState
  }

  const construct: Construct = {
    name: "noteLink",
    tokenize,
  }

  return {
    text: {
      [codes.leftSquareBracket]: construct,
    },
  }
}

// HTML extension (for testing purposes)
export function noteLinkHtml(): HtmlExtension {
  return {
    enter: {},
    exit: {
      [types.noteLink]() {
        this.tag("<note-link></note-link>")
      },
    },
  }
}
