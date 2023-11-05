import { useAtomValue } from "jotai"
import { CommandMenu } from "../components/command-menu"
import { SignedInUser } from "../components/github-auth"
import { SettingsIcon24 } from "../components/icons"
import { Panel } from "../components/panel"
import { RepoForm } from "../components/repo-form"
import { githubRepoAtom, githubUserAtom } from "../global-state"
import React from "react"
import { Button } from "../components/button"
import { Card } from "../components/card"

export function SettingsPage() {
  const githubUser = useAtomValue(githubUserAtom)
  const githubRepo = useAtomValue(githubRepoAtom)
  const [isEditingRepo, setIsEditingRepo] = React.useState(false)

  return (
    <>
      <CommandMenu />
      {/* TODO: Replace with 16px icon */}
      <Panel icon={<SettingsIcon24 />} title="Settings">
        <div className="grid gap-4 p-4">
          <h3 className="text-xl font-semibold leading-4">GitHub</h3>
          <SignedInUser />
          {githubUser && githubRepo ? (
            !isEditingRepo ? (
              <Card className="flex items-center justify-between p-4">
                <div className="flex flex-col gap-1 coarse:gap-2">
                  <span className="text-sm leading-3 text-text-secondary">Repository</span>
                  <a
                    href={`https://github.com/${githubRepo.owner}/${githubRepo.name}`}
                    className="link link-external leading-5"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {githubRepo.owner}/{githubRepo.name}
                  </a>
                </div>
                <Button className="flex-shrink-0" onClick={() => setIsEditingRepo(true)}>
                  Change
                </Button>
              </Card>
            ) : (
              <RepoForm
                onSubmit={() => setIsEditingRepo(false)}
                onCancel={() => setIsEditingRepo(false)}
              />
            )
          ) : null}
        </div>
      </Panel>
    </>
  )
}
