import { cx } from "../utils/cx"

type WebsiteFaviconProps = React.ComponentPropsWithoutRef<"img"> & {
  url: string
  size?: 16 | 32 | 64 | 128 | 256
}

export function WebsiteFavicon({
  url,
  size = 16,
  className,
  style,
  ...props
}: WebsiteFaviconProps) {
  return (
    <img
      aria-hidden
      alt=""
      className={cx("inline-block size-icon rounded-none! object-contain", className)}
      style={{ width: size, height: size, ...style }}
      src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
        url,
      )}&size=${size * 2}`}
      {...props}
    />
  )
}
