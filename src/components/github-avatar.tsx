import { cx } from "../utils/cx"

type GitHubAvatarProps = React.ComponentPropsWithoutRef<"div"> & {
  login: string
  size?: number
}

export function GitHubAvatar({ login, size = 32, className, style, ...props }: GitHubAvatarProps) {
  return (
    <div
      aria-hidden
      className={cx(
        "inline-block size-icon flex-shrink-0 rounded-full bg-[white] bg-cover ring-1 ring-inset ring-border-secondary",
        className,
      )}
      style={{
        backgroundImage: `url(https://github.com/${login}.png?size=${size * 2})`,
        ...style,
      }}
      {...props}
    />
  )
}
