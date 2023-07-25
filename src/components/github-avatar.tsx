import React from "react"

export function GitHubAvatar({ username }: { username: string }) {
  return (
    <div
      aria-hidden
      className="inline-block h-8 w-8 flex-shrink-0 rounded-full bg-bg-secondary bg-cover ring-1 ring-inset ring-border-secondary"
      style={{
        backgroundImage: `url(https://github.com/${username}.png?size=64)`,
      }}
    />
  )
}
