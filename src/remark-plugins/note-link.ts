import {
  Code,
  Construct,
  Extension,
  HtmlExtension,
  State,
  Tokenizer,
} from "micromark-util-types"
import { codes } from "micromark-util-symbol/codes"

const types = {
  noteLink: "noteLink",
}

// Syntax extension
export function noteLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    return nextState

    function nextState(code: Code): State | void {
      effects.enter(types.noteLink)
      effects.consume(code)
      effects.exit(types.noteLink)
      return ok
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
