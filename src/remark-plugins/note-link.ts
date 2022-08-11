import { codes } from "micromark-util-symbol/codes"
import {
  Code,
  Construct,
  Extension,
  HtmlExtension,
  State,
  Tokenizer,
} from "micromark-util-types"
import { createMachine, interpret } from "xstate"

const types = {
  noteLink: "noteLink",
}

const noteLinkMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QDsD2AXMAZAlsg1gHRqa4GECMAxAMIASAggEqKgAOqsO6OqyrIAB6IKAVlGFRABhkAmCrNkBOAGwUlolQBoQAT0SzRAFkJKzSgBxGpAdjsXRAZhsBfFzpLY8RT2XxUIPjBCWHQAQ0xiDC9yX28BDi4ePgFhBCNHJUJrFXkLMXEbKW09A2LTc1yrfJVRCzd3EDQIOAE42Oi-SgTObl5+JCFEG1kdfQRZFQtsyvzxUSLXRvafTu9CQOQwHqT+1IMLR0pHWXzDMYMVGwqzK1t7JyWPNY7SeMHEvpTBtKMLC4QGhulmsdhsDkcRjczze5FQ+B2XwGoDSCwBtSkwKMFDUDiMKihyxeqwRH16yWRQ3So1KCEcFkx5lUpz+OLq0KaxMRFP2CAo-1pshMMhFotFFEJbiAA */
  createMachine({
    tsTypes: {} as import("./note-link.typegen").Typegen0,
    schema: { events: {} as { type: "CHAR"; code: Code } },
    id: "noteLink",
    initial: "noteLink",
    states: {
      noteLink: {
        entry: "enterNoteLink",
        exit: "exitNoteLink",
        initial: "1",
        states: {
          "1": {
            on: {
              CHAR: {
                actions: "consume",
                target: "done",
              },
            },
          },
          done: {
            type: "final",
          },
        },
        onDone: {
          target: "ok",
        },
      },
      ok: {
        type: "final",
      },
      nok: {
        type: "final",
      },
    },
  })

// Syntax extension
export function noteLink(): Extension {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    const service = interpret(
      noteLinkMachine.withConfig({
        actions: {
          consume: (context, event) => effects.consume(event.code),
          enterNoteLink: () => effects.enter(types.noteLink),
          exitNoteLink: () => effects.exit(types.noteLink),
        },
      }),
    )

    service.start()

    function nextState(code: Code): State | void {
      service.send({ type: "CHAR", code })

      if (service.state.value === "ok") return ok(code)

      if (service.state.value === "nok") return nok(code)

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
