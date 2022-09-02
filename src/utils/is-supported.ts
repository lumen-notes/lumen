/**
 * Returns `true` if the File System Access API is supported and usable.
 * Copied from https://github.com/GoogleChromeLabs/browser-fs-access/blob/main/src/supported.mjs
 */
export function isSupported() {
  // When running in an SSR environment return `false`
  if (typeof self === "undefined") {
    return false
  }

  // TODO: Remove this check once Permissions Policy integration has happened.
  // Tracked in https://github.com/WICG/file-system-access/issues/245
  if ("top" in self && self !== top) {
    try {
      // This will succeed on same-origin iframes, but fail on cross-origin iframes
      // @ts-ignore
      top.location + ""
    } catch {
      return false
    }
  } else if ("showOpenFilePicker" in self) {
    return true
  }

  return false
}
