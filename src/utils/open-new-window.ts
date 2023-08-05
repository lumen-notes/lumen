import qs from "qs"

export function openNewWindow(url: string) {
  const [pathname, search] = url.split("?")
  const newWindowWidth = 600
  const newWindowHeight = 600

  window.open(
    `${pathname}?${qs.stringify({ ...qs.parse(search), fullscreen: true })}`,
    `${url}`,
    `width=${newWindowWidth}, height=${newWindowHeight}, top=${
      window.screen.height / 2 - newWindowHeight / 2
    }, left=${window.screen.width / 2 - newWindowWidth / 2}`,
  )
}
