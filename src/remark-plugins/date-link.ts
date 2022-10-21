import { Root } from "mdast"
import { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { codes } from "micromark-util-symbol/codes"
import { Code, Construct, Extension, HtmlExtension, State, Tokenizer } from "micromark-util-types"
import { Plugin } from "unified"
import { Node } from "unist"

const types = {
  dateLink: "dateLink",
  dateLinkMarker: "dateLinkMarker",
  dateLinkFull: "dateLinkFull",
  dateLinkYear: "dateLinkYear",
  dateLinkMonth: "dateLinkMonth",
  dateLinkDay: "dateLinkDay",
  dateLinkSeparator: "dateLinkSeparator",
}

// Syntax extension (text -> tokens)
export function dateLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return enter

    function enter(code: Code): State | void {
      if (isOpeningMarkerChar(code)) {
        effects.enter(types.dateLink)
        effects.enter(types.dateLinkMarker)
        effects.consume(code)
        return exitOpeningMarker
      } else {
        return nok(code)
      }
    }

    function exitOpeningMarker(code: Code): State | void {
      if (isOpeningMarkerChar(code)) {
        effects.consume(code)
        effects.exit(types.dateLinkMarker)
        effects.enter(types.dateLinkFull)
        return enterYear1
      } else {
        return nok(code)
      }
    }

    function enterYear1(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.enter(types.dateLinkYear)
        effects.consume(code)
        return enterYear2
      } else {
        return nok(code)
      }
    }

    function enterYear2(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.consume(code)
        return enterYear3
      } else {
        return nok(code)
      }
    }

    function enterYear3(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.consume(code)
        return enterYear4
      } else {
        return nok(code)
      }
    }

    function enterYear4(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.consume(code)
        effects.exit(types.dateLinkYear)
        return enterSeparator1
      } else {
        return nok(code)
      }
    }

    function enterSeparator1(code: Code): State | void {
      if (isSeparatorChar(code)) {
        effects.enter(types.dateLinkSeparator)
        effects.consume(code)
        effects.exit(types.dateLinkSeparator)
        return enterMonth1
      } else {
        return nok(code)
      }
    }

    function enterMonth1(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.enter(types.dateLinkMonth)
        effects.consume(code)
        return enterMonth2
      } else {
        return nok(code)
      }
    }

    function enterMonth2(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.consume(code)
        effects.exit(types.dateLinkMonth)
        return enterSeparator2
      } else {
        return nok(code)
      }
    }

    function enterSeparator2(code: Code): State | void {
      if (isSeparatorChar(code)) {
        effects.enter(types.dateLinkSeparator)
        effects.consume(code)
        effects.exit(types.dateLinkSeparator)
        return enterDay1
      } else {
        return nok(code)
      }
    }

    function enterDay1(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.enter(types.dateLinkDay)
        effects.consume(code)
        return enterDay2
      } else {
        return nok(code)
      }
    }

    function enterDay2(code: Code): State | void {
      if (isNumberChar(code)) {
        effects.consume(code)
        effects.exit(types.dateLinkDay)
        return enterClosingMarker
      } else {
        return nok(code)
      }
    }

    function enterClosingMarker(code: Code): State | void {
      if (isClosingMarkerChar(code)) {
        effects.exit(types.dateLinkFull)
        effects.enter(types.dateLinkMarker)
        effects.consume(code)
        return exitClosingMarker
      } else {
        return nok(code)
      }
    }

    function exitClosingMarker(code: Code): State | void {
      if (isClosingMarkerChar(code)) {
        effects.consume(code)
        effects.exit(types.dateLinkMarker)
        effects.exit(types.dateLink)
        return ok
      } else {
        return nok(code)
      }
    }
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

/** Returns true if character is a valid opening marker */
function isOpeningMarkerChar(code: number | null): boolean {
  return code === codes.leftSquareBracket
}

/** Returns true if character is a valid closing marker */
function isClosingMarkerChar(code: number | null): boolean {
  return code === codes.rightSquareBracket
}

/** Returns true if character is a valid number */
function isNumberChar(code: number | null): boolean {
  if (code === null) return false
  return code >= codes.digit0 && code <= codes.digit9
}

/** Returns true if character is a valid separator */
function isSeparatorChar(code: number | null): boolean {
  return code === codes.dash
}

// HTML extension (tokens -> HTML)
// This is only used for unit testing
export function dateLinkHtml(): HtmlExtension {
  return {
    enter: {
      [types.dateLinkFull](token) {
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
      [types.dateLink](token) {
        this.enter({ type: "dateLink", data: { date: "" } }, token)
      },
      [types.dateLinkFull](token) {
        date = this.sliceSerialize(token)
      },
    },
    exit: {
      [types.dateLink](token) {
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
