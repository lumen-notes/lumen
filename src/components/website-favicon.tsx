import { cx } from "../utils/cx"

type WebsiteFaviconProps = React.ComponentPropsWithoutRef<"div"> & {
  url: string
}

export function WebsiteFavicon({ url, className, ...props }: WebsiteFaviconProps) {
  return (
    <div
      aria-hidden
      className={cx("inline-block size-icon bg-contain bg-center bg-no-repeat", className)}
      style={{
        backgroundImage: `url(https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
          url,
        )}&size=32)`,
      }}
      {...props}
    />
  )
}
