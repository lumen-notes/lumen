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
      className={cx("inline-block shrink-0 rounded-full! bg-[white]", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  )
}
