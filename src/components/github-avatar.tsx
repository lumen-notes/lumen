import { cx } from "../utils/cx"

type GitHubAvatarProps = React.ComponentPropsWithoutRef<"div"> & {
  login: string
  size?: number
}

export function GitHubAvatar({ login, size = 32, className, ...props }: GitHubAvatarProps) {
  return (
    <img
      aria-hidden
      alt=""
      src={`https://github.com/${login}.png?size=${size * 2}`}
      className={cx("inline-block size-icon flex-shrink-0 !rounded-full bg-[white]", className)}
      {...props}
    />
  )
}
