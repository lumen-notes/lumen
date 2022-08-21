import { Root } from "mdast"
import { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { codes } from "micromark-util-symbol/codes"
import {
  Code,
  Construct,
  Extension,
  HtmlExtension,
  State,
  Tokenizer,
} from "micromark-util-types"
import { Plugin } from "unified"
import { Node } from "unist"
import { assign, createMachine, interpret, send } from "xstate"

const tokenTypes = {
  dateLink: "dateLink",
  dateLinkMarker: "dateLinkMarker",
  dateLinkFull: "dateLinkFull",
  dateLinkYear: "dateLinkYear",
  dateLinkMonth: "dateLinkMonth",
  dateLinkDay: "dateLinkDay",
  dateLinkSeparator: "dateLinkSeparator",
}

const dateLinkMachine = createMachine(
  {
    tsTypes: {} as import("./date-link.typegen").Typegen0,
    schema: {
      context: {} as { year: string; month: string; day: string },
      events: {} as { type: "CHAR"; code: Code },
    },
    id: "dateLink",
    context: {
      year: "",
      month: "",
      day: "",
    },
    initial: "dateLink",
    states: {
      dateLink: {
        entry: {
          type: "enter",
          tokenType: tokenTypes.dateLink,
        },
        exit: {
          type: "exit",
          tokenType: tokenTypes.dateLink,
        },
        initial: "openingMarker",
        states: {
          openingMarker: {
            entry: {
              type: "enter",
              tokenType: tokenTypes.dateLinkMarker,
            },
            exit: {
              type: "exit",
              tokenType: tokenTypes.dateLinkMarker,
            },
            initial: "1",
            states: {
              1: {
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
                target: "full",
              },
            ],
          },
          full: {
            entry: {
              type: "enter",
              tokenType: tokenTypes.dateLinkFull,
            },
            exit: {
              type: "exit",
              tokenType: tokenTypes.dateLinkFull,
            },
            initial: "year",
            states: {
              year: {
                entry: {
                  type: "enter",
                  tokenType: tokenTypes.dateLinkYear,
                },
                exit: {
                  type: "exit",
                  tokenType: tokenTypes.dateLinkYear,
                },
                initial: "1",
                states: {
                  1: {
                    on: {
                      CHAR: [
                        {
                          cond: "isNumberChar",
                          actions: ["consume", "appendYear"],
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
                          actions: ["consume", "appendYear"],
                          target: "3",
                        },
                        {
                          target: "nok",
                        },
                      ],
                    },
                  },
                  3: {
                    on: {
                      CHAR: [
                        {
                          cond: "isNumberChar",
                          actions: ["consume", "appendYear"],
                          target: "4",
                        },
                        {
                          target: "nok",
                        },
                      ],
                    },
                  },
                  4: {
                    on: {
                      CHAR: [
                        {
                          cond: "isNumberChar",
                          actions: ["consume", "appendYear"],
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
                    target: "separator1",
                  },
                ],
              },
              separator1: {
                entry: {
                  type: "enter",
                  tokenType: tokenTypes.dateLinkSeparator,
                },
                exit: {
                  type: "exit",
                  tokenType: tokenTypes.dateLinkSeparator,
                },
                initial: "1",
                states: {
                  1: {
                    on: {
                      CHAR: [
                        {
                          cond: "isSeparatorChar",
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
                    target: "month",
                  },
                ],
              },
              month: {
                entry: {
                  type: "enter",
                  tokenType: tokenTypes.dateLinkMonth,
                },
                exit: {
                  type: "exit",
                  tokenType: tokenTypes.dateLinkMonth,
                },
                initial: "1",
                states: {
                  1: {
                    on: {
                      CHAR: [
                        {
                          cond: "isNumberChar",
                          actions: ["consume", "appendMonth"],
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
                          actions: ["consume", "appendMonth"],
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
                    target: "separator2",
                  },
                ],
              },
              separator2: {
                entry: {
                  type: "enter",
                  tokenType: tokenTypes.dateLinkSeparator,
                },
                exit: {
                  type: "exit",
                  tokenType: tokenTypes.dateLinkSeparator,
                },
                initial: "1",
                states: {
                  1: {
                    on: {
                      CHAR: [
                        {
                          cond: "isSeparatorChar",
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
                    target: "day",
                  },
                ],
              },
              day: {
                entry: {
                  type: "enter",
                  tokenType: tokenTypes.dateLinkDay,
                },
                exit: {
                  type: "exit",
                  tokenType: tokenTypes.dateLinkDay,
                },
                initial: "1",
                states: {
                  1: {
                    on: {
                      CHAR: [
                        {
                          cond: "isNumberChar",
                          actions: ["consume", "appendDay"],
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
                          actions: ["consume", "appendDay"],
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
              nok: {
                type: "final",
              },
            },
            onDone: [
              {
                cond: "isOk",
                target: "validateDate",
              },
            ],
          },
          validateDate: {
            always: [
              {
                cond: "isValidDate",
                target: "closingMarker",
              },
              {
                target: "nok",
              },
            ],
          },
          closingMarker: {
            entry: {
              type: "enter",
              tokenType: tokenTypes.dateLinkMarker,
            },
            exit: {
              type: "exit",
              tokenType: tokenTypes.dateLinkMarker,
            },
            initial: "1",
            states: {
              1: {
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
      isSeparatorChar: (context, event) => {
        return event.code === codes.dash
      },
      isValidDate: (context, event) => {
        const date = new Date(`${context.year}-${context.month}-${context.day}`)
        return !isNaN(date.valueOf())
      },
    },
    actions: {
      appendYear: assign({
        year: (context, event) =>
          event.code
            ? context.year + String.fromCharCode(event.code)
            : context.year,
      }),
      appendMonth: assign({
        month: (context, event) =>
          event.code
            ? context.month + String.fromCharCode(event.code)
            : context.month,
      }),
      appendDay: assign({
        day: (context, event) =>
          event.code
            ? context.day + String.fromCharCode(event.code)
            : context.day,
      }),
    },
  },
)

// Syntax extension (text -> tokens)
export function dateLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    const service = interpret(
      dateLinkMachine.withConfig({
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
        return nok(code)
      }

      return nextState
    }

    return nextState
  }

  const construct: Construct = {
    name: "dateLink",
    tokenize,
  }

  return {
    text: {
      [codes.leftSquareBracket]: construct,
    },
  }
}

// HTML extension (tokens -> HTML)
// This is only used for unit testing
export function dateLinkHtml(): HtmlExtension {
  return {
    enter: {
      [tokenTypes.dateLinkFull](token) {
        const date = this.sliceSerialize(token)
        this.tag(`<date-link date="${date}" />`)
      },
    },
  }
}

// Register dateLink as an mdast node type
interface DateLink extends Node {
  type: "dateLink"
  data: { date: string }
}

declare module "mdast" {
  interface StaticPhrasingContentMap {
    dateLink: DateLink
  }
}

// MDAST extension (tokens -> MDAST)
export function dateLinkFromMarkdown(): FromMarkdownExtension {
  // Initialize state
  let date: string | undefined

  return {
    enter: {
      [tokenTypes.dateLink](token) {
        this.enter({ type: "dateLink", data: { date: "" } }, token)
      },
      [tokenTypes.dateLinkFull](token) {
        date = this.sliceSerialize(token)
      },
    },
    exit: {
      [tokenTypes.dateLink](token) {
        const node = this.stack[this.stack.length - 1]

        if (node.type === "dateLink" && date) {
          node.data.date = date
        }

        this.exit(token)

        // Reset state
        date = undefined
      },
    },
  }
}

// Remark plugin
// Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
export function remarkDateLink(): ReturnType<Plugin<[], Root>> {
  // @ts-ignore I'm not sure how to type `this`
  const data = this.data()

  add("micromarkExtensions", dateLink())
  add("fromMarkdownExtensions", dateLinkFromMarkdown())

  function add(field: string, value: unknown) {
    const list = data[field] ? data[field] : (data[field] = [])
    list.push(value)
  }
}
