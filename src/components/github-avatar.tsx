type GitHubAvatarProps = {
  username: string
  size?: number
}

export function GitHubAvatar({ username, size = 32 }: GitHubAvatarProps) {
  return (
    <div
      aria-hidden
      className="inline-block flex-shrink-0 rounded-full bg-bg-secondary bg-cover ring-1 ring-inset ring-border-secondary"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(https://github.com/${username}.png?size=${size * 2})`,
      }}
    />
  )
}
