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
  tagLink: "tagLink",
  tagLinkMarker: "tagLinkMarker",
  tagLinkName: "tagLinkName",
}

/** Syntax extension (text -> tokens) */
export function tagLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return enter

    function enter(code: Code): State | void {
      if (isMarkerChar(code)) {
        effects.enter(types.tagLink)
        effects.enter(types.tagLinkMarker)
        effects.consume(code)
        effects.exit(types.tagLinkMarker)
        return enterName
      } else {
        return nok(code)
      }
    }

    function enterName(code: Code): State | void {
      if (isAlphaChar(code)) {
        effects.enter(types.tagLinkName)
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
        effects.exit(types.tagLinkName)
        effects.exit(types.tagLink)
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
  return isAlphaChar(code) || isNumberChar(code) || code === codes.underscore || code === codes.dash || code === codes.slash
}

/**
 * HTML extension (tokens -> HTML)
 * This is only used for unit testing
 */
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

/** MDAST extension (tokens -> MDAST) */
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

/**
 * Remark plugin
 * Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
 */
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
