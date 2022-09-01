import { Root } from "mdast"
import { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { codes } from "micromark-util-symbol/codes"
import {
  Code,
  Construct,
  Extension,
  HtmlExtension,
  Previous,
  State,
  Tokenizer,
} from "micromark-util-types"
import { Plugin } from "unified"
import { Node } from "unist"
import { createMachine, interpret, send } from "xstate"

const types = {
  tagLink: "tagLink",
  tagLinkMarker: "tagLinkMarker",
  tagLinkName: "tagLinkName",
}

const tagLinkMachine = createMachine(
  {
    tsTypes: {} as import("./tag-link.typegen").Typegen0,
    schema: { events: {} as { type: "CHAR"; code: Code } },
    id: "tagLink",
    initial: "tagLink",
    states: {
      tagLink: {
        entry: {
          type: "enter",
          tokenType: types.tagLink,
        },
        exit: {
          type: "exit",
          tokenType: types.tagLink,
        },
        initial: "marker",
        states: {
          marker: {
            entry: {
              type: "enter",
              tokenType: types.tagLinkMarker,
            },
            exit: {
              type: "exit",
              tokenType: types.tagLinkMarker,
            },
            initial: "1",
            states: {
              1: {
                on: {
                  CHAR: [
                    {
                      cond: "isMarkerChar",
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
                target: "name",
              },
            ],
          },
          name: {
            entry: {
              type: "enter",
              tokenType: types.tagLinkName,
            },
            exit: {
              type: "exit",
              tokenType: types.tagLinkName,
            },
            initial: "1",
            states: {
              1: {
                on: {
                  CHAR: [
                    {
                      cond: "isAlphaChar",
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
                      cond: "isNameChar",
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
      isMarkerChar: (context, event) => {
        return event.code === codes.numberSign
      },
      isAlphaChar: (context, event) => {
        return isAlphaChar(event.code)
      },
      isNameChar: (context, event) => {
        return isNameChar(event.code)
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

/** Returns true if character is in the English alphabet */
function isAlphaChar(code: Code): boolean {
  if (code === null) return false
  return (
    (code >= codes.lowercaseA && code <= codes.lowercaseZ) ||
    (code >= codes.uppercaseA && code <= codes.uppercaseZ)
  )
}

/** Returns true if character is a number  */
function isNumberChar(code: Code): boolean {
  if (code === null) return false
  return code >= codes.digit0 && code <= codes.digit9
}

/** Returns true if character is valid in tag names */
function isNameChar(code: Code): boolean {
  if (code === null) return false
  return isAlphaChar(code) || isNumberChar(code) || code === codes.underscore || code === codes.dash
}

// Syntax extension (text -> tokens)
export function tagLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    const service = interpret(
      tagLinkMachine.withConfig({
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

  const previous: Previous = (code) => {
    return (
      code === codes.space ||
      code === codes.carriageReturn ||
      code === codes.lineFeed ||
      code === codes.carriageReturnLineFeed ||
      code === codes.eof
    )
  }

  const construct: Construct = {
    name: "tagLink",
    tokenize,
    previous,
  }

  return {
    text: {
      [codes.numberSign]: construct,
    },
  }
}

// HTML extension (tokens -> HTML)
// This is only used for unit testing
export function tagLinkHtml(): HtmlExtension {
  return {
    enter: {
      [types.tagLinkName](token) {
        const name = this.sliceSerialize(token)
        this.tag(`<tag-link name="${name}" />`)
      },
    },
  }
}

// Register tagLink as an mdast node type
interface TagLink extends Node {
  type: "tagLink"
  data: { name: string }
}

declare module "mdast" {
  interface StaticPhrasingContentMap {
    tagLink: TagLink
  }
}

// MDAST extension (tokens -> MDAST)
export function tagLinkFromMarkdown(): FromMarkdownExtension {
  // Initialize state
  let name: string | undefined

  return {
    enter: {
      [types.tagLink](token) {
        this.enter({ type: "tagLink", data: { name: "" } }, token)
      },
      [types.tagLinkName](token) {
        name = this.sliceSerialize(token)
      },
    },
    exit: {
      [types.tagLink](token) {
        const node = this.stack[this.stack.length - 1]

        if (node.type === "tagLink") {
          node.data.name = name || ""
        }

        this.exit(token)

        // Reset state
        name = undefined
      },
    },
  }
}

// Remark plugin
// Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
export function remarkTagLink(): ReturnType<Plugin<[], Root>> {
  // @ts-ignore I'm not sure how to type `this`
  const data = this.data()

  add("micromarkExtensions", tagLink())
  add("fromMarkdownExtensions", tagLinkFromMarkdown())

  function add(field: string, value: unknown) {
    const list = data[field] ? data[field] : (data[field] = [])
    list.push(value)
  }
}
