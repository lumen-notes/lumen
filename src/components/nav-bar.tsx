import * as Dialog from "@radix-ui/react-dialog"
import { TooltipContentProps } from "@radix-ui/react-tooltip"
import { useActor } from "@xstate/react"
import clsx from "clsx"
import React from "react"
import { NavLink as RouterNavLink, NavLinkProps, useMatch, useResolvedPath } from "react-router-dom"
import { useNetworkState } from "react-use"
import { GlobalStateContext } from "../global-state"
import { toDateString } from "../utils/date"
import { Button, IconButton } from "./button"
import { Card } from "./card"
import { DropdownMenu } from "./dropdown-menu"
import {
  CalendarFillIcon24,
  CalendarIcon24,
  CloseIcon16,
  MoreIcon24,
  NoteFillIcon24,
  NoteIcon24,
  TagFillIcon24,
  TagIcon24,
} from "./icons"
import { Input } from "./input"
import { NewNoteDialog } from "./new-note-dialog"
import { Tooltip } from "./tooltip"

export function NavBar({ position }: { position: "left" | "bottom" }) {
  const globalState = React.useContext(GlobalStateContext)
  const [state, send] = useActor(globalState.service)
  // Open tooltips on the side opposite to the nav bar.
  const tooltipSide = ({ left: "right", bottom: "top" } as const)[position]
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false)
  const { online } = useNetworkState()
  return (
    <nav
      className={clsx(
        "w-full border-border-secondary",
        // Add a border separating the nav bar from the main content.
        { left: "border-r", bottom: "border-t" }[position],
      )}
    >
      <ul
        className={clsx(
          "flex p-2",
          { left: "h-full flex-col gap-2", bottom: "flex-row" }[position],
        )}
      >
        <li className={clsx({ left: "flex-grow-0", bottom: "flex-grow" }[position])}>
          <NavLink to="/" aria-label="Notes" tooltipSide={tooltipSide} end>
            {({ isActive }) => (isActive ? <NoteFillIcon24 /> : <NoteIcon24 />)}
          </NavLink>
        </li>
        <li className={clsx({ left: "flex-grow-0", bottom: "flex-grow" }[position])}>
          <NavLink
            to={`/dates/${toDateString(new Date())}`}
            aria-label="Today"
            tooltipSide={tooltipSide}
            end
          >
            {({ isActive }) =>
              isActive ? (
                <CalendarFillIcon24 date={new Date().getDate()} />
              ) : (
                <CalendarIcon24 date={new Date().getDate()} />
              )
            }
          </NavLink>
        </li>
        <li className={clsx({ left: "flex-grow-0", bottom: "flex-grow" }[position])}>
          <NavLink to="/tags" aria-label="Tags" tooltipSide={tooltipSide} end>
            {({ isActive }) => (isActive ? <TagFillIcon24 /> : <TagIcon24 />)}
          </NavLink>
        </li>
        <li className={clsx({ left: "flex-grow-0", bottom: "flex-grow" }[position])}>
          <NewNoteDialog.Trigger className="w-full" tooltipSide={tooltipSide} />
        </li>
        <li className={clsx({ left: "mt-auto flex-grow-0", bottom: "flex-grow" }[position])}>
          <DropdownMenu modal={false}>
            <DropdownMenu.Trigger asChild>
              {/* TODO: Focus button when dialog closes. */}
              <IconButton aria-label="More actions" disableTooltip className="w-full">
                <MoreIcon24 />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content side={tooltipSide} align="end">
              <DropdownMenu.Item
                onClick={() =>
                  window.open("https://github.com/colebemis/lumen/issues/new", "_blank")
                }
              >
                {/* TODO: Feedback icon */}
                Send feedback
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item onClick={() => send("SYNC_NOTES")} disabled={!online}>
                {/* TODO: Sync icon */}
                Sync notes
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => setIsSettingsDialogOpen(true)}>
                {/* TODO: Settings icon */}
                Change sync settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
          {/* TODO: Move this to a separate component. */}
          <Dialog.Root open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-bg-inset-backdrop backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/3 z-20 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-0">
                <Card elevation={2} className="grid gap-6 p-4">
                  <Dialog.Close asChild>
                    <IconButton aria-label="Close" className="absolute top-1 right-1">
                      <CloseIcon16 />
                    </IconButton>
                  </Dialog.Close>
                  <div className="grid gap-2">
                    <Dialog.Title className="text-lg font-semibold leading-none">
                      Sync settings
                    </Dialog.Title>
                    <Dialog.Description className="text-text-secondary">
                      Store your notes as Markdown files in a GitHub repository of your choice.
                    </Dialog.Description>
                  </div>
                  <form
                    className="grid gap-4"
                    onSubmit={(event) => {
                      event.preventDefault()
                      const formData = new FormData(event.currentTarget)
                      const authToken = String(formData.get("auth-token"))
                      const repoOwner = String(formData.get("repo-owner"))
                      const repoName = String(formData.get("repo-name"))
                      send({ type: "SET_CONTEXT", data: { authToken, repoOwner, repoName } })
                      setIsSettingsDialogOpen(false)
                    }}
                  >
                    <div className="grid gap-2">
                      <label htmlFor="auth-token" className="leading-4">
                        Personal access token
                      </label>
                      <Input
                        id="auth-token"
                        name="auth-token"
                        spellCheck={false}
                        defaultValue={state.context.authToken}
                      />
                      <p className="markdown text-text-secondary">
                        Generate a{" "}
                        <a
                          href="https://github.com/settings/tokens/new"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          personal access token
                        </a>{" "}
                        with <code>repo</code> access, then paste it here.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="repo-owner" className="leading-4">
                        Repository owner
                      </label>
                      <Input
                        id="repo-owner"
                        name="repo-owner"
                        defaultValue={state.context.repoOwner}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="repo-name" className="leading-4">
                        Repository name
                      </label>
                      <Input
                        id="repo-name"
                        name="repo-name"
                        defaultValue={state.context.repoName}
                      />
                    </div>
                    <Button type="submit" variant="primary" className="mt-2">
                      Save
                    </Button>
                  </form>
                </Card>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </li>
      </ul>
    </nav>
  )
}

function NavLink({
  tooltipSide,
  ...props
}: NavLinkProps & { tooltipSide?: TooltipContentProps["side"] }) {
  const path = useResolvedPath(props.to)
  const match = useMatch({
    path: path.pathname,
    end: props.end,
    caseSensitive: props.caseSensitive,
  })
  const isActive = match !== null

  return (
    <Tooltip>
      <Tooltip.Trigger asChild>
        <RouterNavLink
          className={clsx(
            "inline-flex w-full justify-center rounded p-2 hover:bg-bg-secondary touch:p-3",
            isActive ? "text-text" : "text-text-secondary",
          )}
          {...props}
        />
      </Tooltip.Trigger>
      <Tooltip.Content side={tooltipSide}>{props["aria-label"]}</Tooltip.Content>
    </Tooltip>
  )
}
