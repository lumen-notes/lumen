import { Root } from "mdast"
import { Extension as FromMarkdownExtension } from "mdast-util-from-markdown"
import { codes } from "micromark-util-symbol/codes"
import { Code, Construct, Extension, HtmlExtension, State, Tokenizer } from "micromark-util-types"
import { Plugin } from "unified"
import { Node } from "unist"

const types = {
  priority: "priority",
  priorityMarker: "priorityMarker",
  priorityLevel: "priorityLevel",
}

/** Syntax extension (text -> tokens) */
export function priority(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return enter

    function enter(code: Code): State | void {
      if (code === codes.exclamationMark) {
        effects.enter(types.priority)
        effects.enter(types.priorityMarker)
        effects.consume(code)
        return consumeSecondMarker
      } else {
        return nok(code)
      }
    }

    function consumeSecondMarker(code: Code): State | void {
      if (code === codes.exclamationMark) {
        effects.consume(code)
        effects.exit(types.priorityMarker)
        return consumeLevel
      } else {
        return nok(code)
      }
    }

    function consumeLevel(code: Code): State | void {
      if (code === codes.digit1 || code === codes.digit2 || code === codes.digit3) {
        effects.enter(types.priorityLevel)
        effects.consume(code)
        effects.exit(types.priorityLevel)
        effects.exit(types.priority)
        return ok
      } else {
        return nok(code)
      }
    }
  }

  const construct: Construct = {
    name: "priority",
    tokenize,
  }

  return {
    text: {
      [codes.exclamationMark]: construct,
    },
  }
}

/**
 * HTML extension (tokens -> HTML)
 * This is only used for unit testing
 */
export function priorityHtml(): HtmlExtension {
  return {
    enter: {
      [types.priorityLevel](token) {
        const level = this.sliceSerialize(token)
        this.tag(`<priority level="${level}" />`)
      },
    },
  }
}

// Register priority as an mdast node type
interface Priority extends Node {
  type: "priority"
  value: string
  data: { level: 1 | 2 | 3 }
}

declare module "mdast" {
  interface StaticPhrasingContentMap {
    priority: Priority
  }
}

/** MDAST extension (tokens -> MDAST) */
export function priorityFromMarkdown(): FromMarkdownExtension {
  // Initialize state
  let level: 1 | 2 | 3 = 1

  return {
    enter: {
      [types.priority](token) {
        this.enter({ type: "priority", value: "", data: { level: 1 } }, token)
      },
      [types.priorityLevel](token) {
        level = parseInt(this.sliceSerialize(token)) as 1 | 2 | 3
      },
    },
    exit: {
      [types.priority](token) {
        const node = this.stack[this.stack.length - 1]

        if (node.type === "priority") {
          node.data.level = level
          node.value = `!!${level}`
        }

        this.exit(token)

        // Reset state
        level = 1
      },
    },
  }
}

/**
 * Remark plugin
 * Reference: https://github.com/remarkjs/remark-gfm/blob/main/index.js
 */
export function remarkPriority(): ReturnType<Plugin<[], Root>> {
  // @ts-ignore I'm not sure how to type `this`
  const data = this.data()

  add("micromarkExtensions", priority())
  add("fromMarkdownExtensions", priorityFromMarkdown())

  function add(field: string, value: unknown) {
    const list = data[field] ? data[field] : (data[field] = [])
    list.push(value)
  }
}
