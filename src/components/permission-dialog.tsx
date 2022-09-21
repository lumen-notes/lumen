import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { useActor } from "@xstate/react"
import React from "react"
import { GlobalStateContext } from "../global-state"
import { Button } from "./button"
import { Card } from "./card"

/** Requests permission to access the local file system if necessary */
export function PermissionDialog() {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)

  return state.matches("prompt") && state.context.directoryHandle ? (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          send("PERMISSION_DENIED")
        }
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-20 bg-bg-backdrop backdrop-blur-sm" />
        <AlertDialog.Content asChild>
          <Card
            elevation={2}
            className="fixed top-1/2 left-1/2 z-20 flex w-[90vw] max-w-xs -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-4"
          >
            <div className="flex flex-col gap-2">
              <AlertDialog.Title className="text-base font-semibold leading-none">
                Allow access to {state.context.directoryHandle.name}?
              </AlertDialog.Title>
              <AlertDialog.Description className="text-text-muted">
                Lumen needs permission to access your local {state.context.directoryHandle.name}{" "}
                folder
              </AlertDialog.Description>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AlertDialog.Cancel asChild>
                <Button>Deny</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="primary"
                  onClick={() => send("REQUEST_PERMISSION")}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                >
                  Allow
                </Button>
              </AlertDialog.Action>
            </div>
          </Card>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  ) : null
}
