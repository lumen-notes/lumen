import { Code, State, Tokenizer } from "micromark-util-types"
import { AnyStateMachine, interpret } from "xstate"

/** Turns an XState state machine into a micromark tokenizer */
export function createTokenizer<T extends AnyStateMachine>(machine: T) {
  const tokenize: Tokenizer = (effects, ok, nok) => {
    const service = interpret(
      machine.withConfig({
        actions: {
          consume: (context, event) => {
            effects.consume(event.code)
          },
          enter: (context, event, { action }) => {
            effects.enter(action.tokenType)
          },
          exit: (context, event, { action }) => {
            effects.exit(action.tokenType)
          },
        },
        delays: {},
        guards: {},
        services: {},
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

  return tokenize
}
