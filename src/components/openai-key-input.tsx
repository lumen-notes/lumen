import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { useEvent, useNetworkState } from "react-use"
import { createMachine } from "xstate"
import { OPENAI_KEY_STORAGE_KEY, openaiKeyAtom } from "../global-state"
import { validateOpenAIKey } from "../utils/validate-openai-key"
import { CheckIcon16, ErrorIcon16, LoadingIcon16 } from "./icons"
import { TextInput } from "./text-input"
import { FormControl } from "./form-control"

const openaiKeyValidationMachineAtom = atomWithMachine(() =>
  createMachine(
    {
      id: "openaiKeyValidation",
      types: {} as {
        events: { type: "CHANGE"; openaiKey: string } | { type: "RESTART" }
        services: {
          initialize: {
            data: {
              openaiKey: string
            }
          }
          validate: {
            data: void
          }
        }
      },
      initial: "initializing",
      on: {
        RESTART: "initializing",
      },
      states: {
        initializing: {
          invoke: {
            src: "initialize",
            onDone: [{ cond: "isEmpty", target: "empty" }, { target: "validating" }],
          },
        },
        empty: {
          on: {
            CHANGE: [{ cond: "isEmpty", target: "empty" }, { target: "validating" }],
          },
        },
        validating: {
          invoke: {
            src: "validate",
            onDone: "valid",
            onError: "invalid",
          },
        },
        invalid: {
          on: {
            CHANGE: [{ cond: "isEmpty", target: "empty" }, { target: "validating" }],
          },
        },
        valid: {
          on: {
            CHANGE: [{ cond: "isEmpty", target: "empty" }, { target: "validating" }],
          },
        },
      },
    },
    {
      guards: {
        isEmpty: (context, event) => {
          if (event.type === "CHANGE") {
            return !event.openaiKey
          }

          return !event.data.openaiKey
        },
      },
      services: {
        initialize: async (context, event) => {
          const openaiKey = String(JSON.parse(localStorage.getItem(OPENAI_KEY_STORAGE_KEY) ?? "''"))
          return { openaiKey }
        },
        validate: async (context, event) => {
          const isValid = await validateOpenAIKey(
            event.type === "CHANGE" ? event.openaiKey : event.data.openaiKey,
          )
          if (!isValid) {
            throw new Error("Invalid OpenAI API key")
          }
        },
      },
    },
  ),
)

export function OpenAIKeyInput() {
  const [openaiKey, setOpenaiKey] = useAtom(openaiKeyAtom)
  const [validationState, send] = useAtom(openaiKeyValidationMachineAtom)
  const { online } = useNetworkState()

  useEvent("online", () => {
    send("RESTART")
  })

  return (
    <FormControl
      htmlFor="openai-key"
      label="OpenAI key"
      description={
        online ? (
          <>
            {validationState.matches("valid") ? (
              <span className="flex items-center gap-2 font-mono text-sm text-text-success">
                <CheckIcon16 />
                Valid key
              </span>
            ) : null}
            {validationState.matches("invalid") ? (
              <span className="flex items-center gap-2 font-mono text-sm text-text-danger">
                <ErrorIcon16 />
                Invalid key
              </span>
            ) : null}
            {validationState.matches("validating") ? (
              <span className="flex items-center gap-2 font-mono text-sm text-text-secondary">
                <LoadingIcon16 />
                Validating key…
              </span>
            ) : null}
          </>
        ) : null
      }
    >
      <TextInput
        id="openai-key"
        name="openai-key"
        type="password"
        value={openaiKey}
        onChange={(event) => {
          setOpenaiKey(event.target.value)
          send({ type: "CHANGE", openaiKey: event.target.value })
        }}
        placeholder="sk…"
        invalid={online && validationState.matches("invalid")}
      />
    </FormControl>
  )
}
