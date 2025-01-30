import { cx } from "../utils/cx"

type WebsiteFaviconProps = React.ComponentPropsWithoutRef<"div"> & {
  url: string
}

export function WebsiteFavicon({ url, className, ...props }: WebsiteFaviconProps) {
  return (
    <img
      aria-hidden
      alt=""
      className={cx("inline-block size-icon !rounded-none object-contain", className)}
      src={`https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
        url,
      )}&size=32`}
      {...props}
    />
  )
}
