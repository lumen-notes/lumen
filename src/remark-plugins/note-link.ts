import { Root } from "mdast"
import { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { codes } from "micromark-util-symbol/codes"
import { Code, Construct, Extension, HtmlExtension, State, Tokenizer } from "micromark-util-types"
import { Plugin } from "unified"
import { Node } from "unist"

const types = {
  noteLink: "noteLink",
  noteLinkMarker: "noteLinkMarker",
  noteLinkId: "noteLinkId",
  noteLinkSeparator: "noteLinkSeparator",
  noteLinkText: "noteLinkText",
}

/** Syntax extension (text -> tokens) */
export function noteLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return enter

    function enter(code: Code): State | void {
      if (isOpeningMarkerChar(code)) {
        effects.enter(types.noteLink)
        effects.enter(types.noteLinkMarker)
        effects.consume(code)
        return exitOpeningMarker
      } else {
        return nok(code)
      }
    }

    function exitOpeningMarker(code: Code): State | void {
      if (isOpeningMarkerChar(code)) {
        effects.consume(code)
        effects.exit(types.noteLinkMarker)

        return enterId
      } else {
        return nok(code)
      }
    }

    function enterId(code: Code): State | void {
      if (isFilenameChar(code)) {
        effects.enter(types.noteLinkId)
        effects.consume(code)
        return continueId
      } else {
        return nok(code)
      }
    }

    function continueId(code: Code): State | void {
      if (isSeparatorChar(code)) {
        effects.exit(types.noteLinkId)
        effects.enter(types.noteLinkSeparator)
        effects.consume(code)
        effects.exit(types.noteLinkSeparator)
        return enterText
      } else if (isClosingMarkerChar(code)) {
        effects.exit(types.noteLinkId)
        effects.enter(types.noteLinkMarker)
        effects.consume(code)
        return exitClosingMarker
      } else if (isFilenameChar(code)) {
        effects.consume(code)
        return continueId
      } else {
        return nok(code)
      }
    }

    function enterText(code: Code): State | void {
      if (isTextChar(code)) {
        effects.enter(types.noteLinkText)
        effects.consume(code)
        return continueText
      } else {
        return nok(code)
      }
    }

    function continueText(code: Code): State | void {
      if (isTextChar(code)) {
        effects.consume(code)
        return continueText
      } else if (isClosingMarkerChar(code)) {
        effects.exit(types.noteLinkText)
        effects.enter(types.noteLinkMarker)
        effects.consume(code)
        return exitClosingMarker
      } else {
        return nok(code)
      }
    }

    function exitClosingMarker(code: Code): State | void {
      if (isClosingMarkerChar(code)) {
        effects.consume(code)
        effects.exit(types.noteLinkMarker)
        effects.exit(types.noteLink)
        return ok
      } else {
        return nok(code)
      }
    }
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

/** Returns true if character is a valid opening marker */
function isOpeningMarkerChar(code: Code): boolean {
  return code === codes.leftSquareBracket
}

/** Returns true if character is a valid closing marker */
function isClosingMarkerChar(code: Code): boolean {
  return code === codes.rightSquareBracket
}

/** Returns true if character is a valid filename character */
function isFilenameChar(code: Code): boolean {
  if (code === null) return false
  return (
    (code >= codes.digit0 && code <= codes.digit9) ||
    (code >= codes.uppercaseA && code <= codes.uppercaseZ) ||
    (code >= codes.lowercaseA && code <= codes.lowercaseZ) ||
    code === codes.dash ||
    code === codes.underscore ||
    code === codes.dot ||
    code === codes.tilde ||
    code === codes.exclamationMark ||
    code === codes.dollarSign ||
    code === codes.ampersand ||
    code === codes.apostrophe ||
    code === codes.leftParenthesis ||
    code === codes.rightParenthesis ||
    code === codes.asterisk ||
    code === codes.plusSign ||
    code === codes.comma ||
    code === codes.semicolon ||
    code === codes.atSign ||
    code === codes.leftCurlyBrace ||
    code === codes.rightCurlyBrace ||
    code === codes.space
  )
}

/** Returns true if character is a valid separator character */
function isSeparatorChar(code: Code): boolean {
  return code === codes.verticalBar
}

/** Returns true if character is a valid text character */
function isTextChar(code: Code): boolean {
  return (
    code !== codes.eof &&
    code !== codes.carriageReturn &&
    code !== codes.lineFeed &&
    code !== codes.carriageReturnLineFeed &&
    code !== codes.rightSquareBracket
  )
}

/**
 * HTML extension (tokens -> HTML)
 * This is only used for unit testing
 */
export function noteLinkHtml(): HtmlExtension {
  // Initialize state
  let id: string | undefined
  let text: string | undefined

  return {
    enter: {
      [types.noteLinkId](token) {
        id = this.sliceSerialize(token)
      },
      [types.noteLinkText](token) {
        text = this.sliceSerialize(token)
      },
    },
    exit: {
      [types.noteLink]() {
        this.tag(`<note-link id="${id}" text="${text || id}" />`)

        // Reset state
        id = undefined
        text = undefined
      },
    },
  }
}

// Register noteLink as an mdast node type
interface NoteLink extends Node {
  type: "noteLink"
  value: string
  data: { id: string; text: string }
}

declare module "mdast" {
  interface StaticPhrasingContentMap {
    noteLink: NoteLink
  }
}

/** MDAST extension (tokens -> MDAST) */
export function noteLinkFromMarkdown(): FromMarkdownExtension {
  // Initialize state
  let id: string | undefined
  let text: string | undefined

  return {
    enter: {
      [types.noteLink](token) {
        this.enter({ type: "noteLink", value: "", data: { id: "", text: "" } }, token)
      },
      [types.noteLinkId](token) {
        id = this.sliceSerialize(token)
      },
      [types.noteLinkText](token) {
        text = this.sliceSerialize(token)
      },
    },
    exit: {
      [types.noteLink](token) {
        const node = this.stack[this.stack.length - 1]

        if (node.type === "noteLink") {
          node.data.id = id || ""
          node.data.text = text || id || ""
          node.value = text || id || ""
        }

        this.exit(token)

        // Reset state
        id = undefined
        text = undefined
      },
    },
  }
}

/**
 * Remark plugin
 * Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
 */
export function remarkNoteLink(): ReturnType<Plugin<[], Root>> {
  // @ts-ignore I'm not sure how to type `this`
  const data = this.data()

  add("micromarkExtensions", noteLink())
  add("fromMarkdownExtensions", noteLinkFromMarkdown())

  function add(field: string, value: unknown) {
    const list = data[field] ? data[field] : (data[field] = [])
    list.push(value)
  }
}
