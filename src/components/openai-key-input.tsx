import { useAtom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { useNetworkState } from "react-use"
import { createMachine } from "xstate"
import { OPENAI_KEY_STORAGE_KEY, openaiKeyAtom } from "../global-state"
import { validateOpenAIKey } from "../utils/validate-openai-key"
import { CheckIcon16, ErrorIcon16, LoadingIcon16 } from "./icons"
import { TextInput } from "./text-input"

const openaiKeyValidationMachineAtom = atomWithMachine(() =>
  createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QHsAOYB2BDAlgaTAE8A1LAGxwiwBcdkMA6HDHW8nAL2agGIJ6wTDADdkAa0FpMuAiXZVa9IaxzsuGKAmaiAxjToYA2gAYAuidOJQqZLBX0rIAB6IATK4DMDDwBYPAdgBWABoQQkQARlcATgBfWNCpbHwiUgoFA2U2CnVefgxBbXFJdGTZNMp9JWYVNW4tEWQ9RSMzQwjLJBAbOxbHFwR3L18AkLDEAA4IhkD4xNKZVPkqxjAAW1RqQh4AYQAJAEEAOQBxAFELRx77DH7EQKiGaJiANgmg0PCEH2NohgjAsYgcCQcYPHMQElFnJ0isGOtNtt9sdzu1OtZbDc7gh-AEGK4wVExl8fC8fP9AaDQeCEpCFikYZUWgxhMtaBo+AIhKIJAwoQyKhklKzYezNEVmgYLJcutc+l0BhNPAwlYTXMTEP4IhMKRD+eU2ZkRUzuDwwAAnc3Ic0MVBkGgAM2taz59INoqNho0DV0K2lZiumPloEVrnJL0CL3VnzcPh16r1bqWHuqInku0OpwuAdlQYM2KG3j8H3GCA8L38M0T0gFhtTxogGZRFw6gd6+YVbmVIxLJO11bKyZNwvTyKzMox7YcncG3eLGu+byrtP1Q6FjAbTfHrdzU9uM8LPYXgWigSe8VpGGQEDgjlXjPXbaxM4AtC8YwgX2foj-ov5oj8EyBK4-gTD+A7QoKcI1NknDcE+wbOIgPiuB+0TGPiswrkmD5wgiWwIR2Ib3EE3jGEB0SjB+pLhpSVLAjS8w1u6w4bl6UCEdOxEIBExgEv8ZLGFGC4vC8GHqlqKFAZJMQQbWKaMNo8icfu3ERNqDDkSeVGluWZ5YUxg64cyDYqdiEQeBhFbar29zRDqcQXkAA */
      id: "openaiKeyValidation",
      tsTypes: {} as import("./openai-key-input.typegen").Typegen0,
      schema: {} as {
        events: {
          type: "CHANGE"
          openaiKey: string
        }
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between leading-4 ">
        <label htmlFor="openai-key" className="justify-self-start text-sm text-text-secondary">
          OpenAI key
        </label>
      </div>
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
      />
      {online ? (
        <>
          {validationState.matches("valid") ? (
            <span className="flex items-center gap-2 font-mono text-sm text-text-success">
              <CheckIcon16 />
              Valid
            </span>
          ) : null}
          {validationState.matches("invalid") ? (
            <span className="flex items-center gap-2 font-mono text-sm text-text-danger">
              <ErrorIcon16 />
              Invalid
            </span>
          ) : null}
          {validationState.matches("validating") ? (
            <span className="flex items-center gap-2 font-mono text-sm text-text-secondary">
              <LoadingIcon16 />
              Validating…
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
