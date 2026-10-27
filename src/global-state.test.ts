import { createStore } from "jotai"
import type { Atom } from "jotai"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { epaperAtom, vimModeAtom } from "./global-state"

vi.mock("./utils/fs", () => ({
  fs: {},
  fsWipe() {},
}))

type MemoryStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

let storage: MemoryStorage

function installStorage() {
  const memory = new Map<string, string>()
  storage = {
    getItem: (key) => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key, value) => {
      memory.set(key, String(value))
    },
    removeItem: (key) => {
      memory.delete(key)
    },
    clear: () => {
      memory.clear()
    },
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: storage,
      addEventListener() {},
      removeEventListener() {},
    },
  })
}

function readAfterReload(atom: Atom<boolean>) {
  const store = createStore()
  store.sub(atom, () => {})
  return store.get(atom)
}

beforeEach(() => {
  installStorage()
})

describe("vim mode setting", () => {
  test("stays on after it is turned on, then the page reloads or the user signs in again", () => {
    const store = createStore()
    store.sub(vimModeAtom, () => {})
    store.set(vimModeAtom, true)

    expect(storage.getItem("vim-mode")).toBe("true")
    expect(readAfterReload(vimModeAtom)).toBe(true)

    storage.removeItem("github_user")

    expect(readAfterReload(vimModeAtom)).toBe(true)
  })

  test("stays on across a reload and a re-login", () => {
    storage.setItem("vim-mode", "true")
    storage.setItem(
      "github_user",
      JSON.stringify({ token: "t", login: "ada", name: "Ada", email: "ada@example.com" }),
    )

    expect(readAfterReload(vimModeAtom)).toBe(true)

    storage.removeItem("github_user")

    expect(readAfterReload(vimModeAtom)).toBe(true)
    expect(storage.getItem("vim-mode")).toBe("true")
  })

  test("stays on when the saved preference is under the previous editor settings key", () => {
    storage.setItem("editor_settings", JSON.stringify({ vimMode: true, lineNumbers: false }))

    expect(readAfterReload(vimModeAtom)).toBe(true)

    storage.removeItem("editor_settings")

    expect(readAfterReload(vimModeAtom)).toBe(true)
  })

  test("stays on when the saved preference is under the original vim_mode key", () => {
    storage.setItem("vim_mode", "true")

    expect(readAfterReload(vimModeAtom)).toBe(true)
    expect(readAfterReload(vimModeAtom)).toBe(true)
  })

  test("stays on when the newer settings blob is corrupt and the original key is on", () => {
    storage.setItem("editor_settings", "{")
    storage.setItem("vim_mode", "true")

    expect(readAfterReload(vimModeAtom)).toBe(true)
  })
})

describe("e-paper setting", () => {
  test("stays on across a reload", () => {
    storage.setItem("epaper", "true")

    expect(readAfterReload(epaperAtom)).toBe(true)
  })

  test("stays on when the saved preference is under the previous theme key", () => {
    storage.setItem("theme", JSON.stringify("eink"))

    expect(readAfterReload(epaperAtom)).toBe(true)

    storage.removeItem("theme")

    expect(readAfterReload(epaperAtom)).toBe(true)
  })
})
