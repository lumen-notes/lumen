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

const types = {
  tag: "tag",
  tagMarker: "tagMarker",
  tagName: "tagName",
}

/** Syntax extension (text -> tokens) */
export function tag(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return enter

    function enter(code: Code): State | void {
      if (isMarkerChar(code)) {
        effects.enter(types.tag)
        effects.enter(types.tagMarker)
        effects.consume(code)
        effects.exit(types.tagMarker)
        return enterName
      } else {
        return nok(code)
      }
    }

    function enterName(code: Code): State | void {
      if (isAlphaChar(code)) {
        effects.enter(types.tagName)
        effects.consume(code)
        return continueName
      } else {
        return nok(code)
      }
    }

    function continueName(code: Code): State | void {
      if (isNameChar(code)) {
        effects.consume(code)
        return continueName
      } else {
        effects.exit(types.tagName)
        effects.exit(types.tag)
        return ok(code)
      }
    }
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
    name: "tag",
    tokenize,
    previous,
  }

  return {
    text: {
      [codes.numberSign]: construct,
    },
  }
}

/** Returns true if character is valid tag marker */
function isMarkerChar(code: Code): boolean {
  return code === codes.numberSign
}

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
  return (
    isAlphaChar(code) ||
    isNumberChar(code) ||
    code === codes.underscore ||
    code === codes.dash ||
    code === codes.slash
  )
}

/**
 * HTML extension (tokens -> HTML)
 * This is only used for unit testing
 */
export function tagHtml(): HtmlExtension {
  return {
    enter: {
      [types.tagName](token) {
        const name = this.sliceSerialize(token)
        this.tag(`<tag-link name="${name}" />`)
      },
    },
  }
}

// Register tag as an mdast node type
interface Tag extends Node {
  type: "tag"
  value: string
  data: { name: string }
}

declare module "mdast" {
  interface StaticPhrasingContentMap {
    tag: Tag
  }
}

/** MDAST extension (tokens -> MDAST) */
export function tagFromMarkdown(): FromMarkdownExtension {
  // Initialize state
  let name: string | undefined

  return {
    enter: {
      [types.tag](token) {
        this.enter({ type: "tag", value: "", data: { name: "" } }, token)
      },
      [types.tagName](token) {
        name = this.sliceSerialize(token)
      },
    },
    exit: {
      [types.tag](token) {
        const node = this.stack[this.stack.length - 1]

        if (node.type === "tag") {
          node.data.name = name || ""
          node.value = `#${name}`
        }

        this.exit(token)

        // Reset state
        name = undefined
      },
    },
  }
}

/**
 * Remark plugin
 * Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
 */
export function remarkTag(): ReturnType<Plugin<[], Root>> {
  // @ts-ignore I'm not sure how to type `this`
  const data = this.data()

  add("micromarkExtensions", tag())
  add("fromMarkdownExtensions", tagFromMarkdown())

  function add(field: string, value: unknown) {
    const list = data[field] ? data[field] : (data[field] = [])
    list.push(value)
  }
}
