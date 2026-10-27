// @vitest-environment happy-dom
import "fake-indexeddb/auto"
import { EditorSelection, EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import git from "isomorphic-git"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { attachDroppedFile } from "../hooks/attach-file"
import { fs } from "../utils/fs"
import { REPO_DIR } from "../utils/git"
import { dropExtension } from "./drop"

const githubUser = {
  token: "t",
  login: "testowner",
  name: "Test",
  email: "t@example.com",
}

const githubRepo = {
  owner: "testowner",
  name: "notes",
}

const screenshotName = "Screenshot 2026-10-27 at 2.37.00\u202fPM.png"
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])

beforeAll(async () => {
  await git.init({ fs, dir: REPO_DIR, defaultBranch: "main" })
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: githubUser.name })
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: githubUser.email })
})

afterEach(() => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true })
})

function screenshotFile() {
  return new File([pngBytes], screenshotName, { type: "image/png" })
}

function dropScreenshot(online: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: online })
  let pending: Promise<string | null> | null = null
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({
      doc: "hello",
      selection: EditorSelection.cursor(5),
      extensions: [
        dropExtension({
          attachFile: (file, editorView, coords) => {
            pending = attachDroppedFile({
              file,
              view: editorView,
              githubUser,
              githubRepo,
              coords,
            })
            return pending
          },
        }),
      ],
    }),
  })

  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(screenshotFile())
  const rect = view.contentDOM.getBoundingClientRect()
  const event = new DragEvent("drop", {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + 8,
    clientY: rect.top + 8,
  })
  Object.defineProperty(event, "dataTransfer", { value: dataTransfer })
  view.contentDOM.dispatchEvent(event)

  return { view, pending }
}

describe("dropping a file on the editor", () => {
  it("inserts image markdown and writes a macOS screenshot", async () => {
    const { view, pending } = dropScreenshot(true)
    expect(pending).not.toBeNull()
    expect(await pending).toBeNull()

    const markdown = view.state.doc.toString()
    expect(markdown).toContain("hello")
    expect(markdown).toMatch(
      /!\[Screenshot 2026-10-27 at 2\.37\.00\u202fPM\]\(\/uploads\/\d+\.png\)/,
    )
    expect(markdown.match(/!\[/g)).toHaveLength(1)

    const path = markdown.match(/\/uploads\/\d+\.png/)?.[0]
    expect(path).toBeTruthy()
    const written = await fs.promises.readFile(`${REPO_DIR}${path}`)
    const bytes = typeof written === "string" ? new TextEncoder().encode(written) : written
    expect(Array.from(bytes)).toEqual(Array.from(pngBytes))
    view.destroy()
  })

  it("reports an error and leaves the note unchanged when offline", async () => {
    const { view, pending } = dropScreenshot(false)
    expect(pending).not.toBeNull()
    expect(await pending).toMatch(/offline/i)
    expect(view.state.doc.toString()).toBe("hello")
    view.destroy()
  })
})
