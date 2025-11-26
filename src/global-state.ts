import { Searcher } from "fast-fuzzy"
import git, { WORKDIR } from "isomorphic-git"
import { atom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { assign, createMachine, raise } from "xstate"
import { z } from "zod"
import {
  Font,
  GitHubRepository,
  GitHubUser,
  Note,
  NoteId,
  Template,
  githubUserSchema,
  templateSchema,
} from "./schema"
import { fs, fsWipe } from "./utils/fs"
import {
  REPO_DIR,
  getRemoteOriginUrl,
  gitAdd,
  gitClone,
  gitCommit,
  gitPull,
  gitPush,
  gitRemove,
  isRepoSynced,
} from "./utils/git"
import { parseNote } from "./utils/parse-note"
import { removeTemplateFrontmatter } from "./utils/remove-template-frontmatter"
import { getSampleMarkdownFiles } from "./utils/sample-markdown-files"
import { startTimer } from "./utils/timer"

// -----------------------------------------------------------------------------
// State machine
// -----------------------------------------------------------------------------

const GITHUB_USER_STORAGE_KEY = "github_user" as const
const MARKDOWN_FILES_STORAGE_KEY = "markdown_files" as const

type Context = {
  githubUser: GitHubUser | null
  githubRepo: GitHubRepository | null
  markdownFiles: Record<string, string>
  error: Error | null
}

type Event =
  | { type: "SIGN_IN"; githubUser: GitHubUser }
  | { type: "SIGN_OUT" }
  | { type: "SELECT_REPO"; githubRepo: GitHubRepository }
  | { type: "SYNC" }
  | { type: "SYNC_DEBOUNCED" }
  | { type: "WRITE_FILES"; markdownFiles: Record<string, string>; commitMessage?: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m0UNCyADC6FurwAogAZA-buk-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-JZEenuOwpM5l3NYnhcQ48y5+9lziBXA-LipGeY3yHD+FkTKVw1MOIZ1NkTIFJ7YdceV76ayYimlATslKImqDfBbGy1Z-kxuuNfz4b-KgyuRpJrlHyBUwrtfjAmBRKtAYsneC-IiBPI6V6wB0Xo2ADmVYffixRVIuwUQJTCGOOxoQ0ltW3cXnJZe9us84xX3ARTlcLjat4RE51alHANuBm+o9DKOF-B85Kg+Yds7U1UJFIg09ykiBxaxRwkjmuJZ4GE0o4iUsOPZDfeds1SvVUGqA+-bo9QDDY8mSQE2a0--FS6NdcbZVf3EffDV9YjNPVMcUKlRRWmJYQUaTCHMlAlNMPuY4dZDIIAA */
      id: "global",
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {} as {
        context: Context
        events: Event
        services: {
          resolveUser: {
            data: { githubUser: GitHubUser }
          }
          resolveRepo: {
            data: {
              githubRepo: GitHubRepository
              markdownFiles: Record<string, string>
            }
          }
          cloneRepo: {
            data: { markdownFiles: Record<string, string> }
          }
          pull: {
            data: { markdownFiles: Record<string, string> }
          }
          push: {
            data: void
          }
          checkStatus: {
            data: { isSynced: boolean }
          }
          writeFiles: {
            data: void
          }
          deleteFile: {
            data: void
          }
        }
      },
      predictableActionArguments: true,
      initial: "resolvingUser",
      context: {
        githubUser: null,
        githubRepo: null,
        markdownFiles: {},
        error: null,
      },
      states: {
        resolvingUser: {
          invoke: {
            src: "resolveUser",
            onDone: {
              target: "signedIn",
              actions: "setGitHubUser",
            },
            onError: "signedOut",
          },
        },
        signedOut: {
          entry: [
            "clearGitHubUser",
            "clearGitHubUserLocalStorage",
            "clearMarkdownFilesLocalStorage",
            "clearFileSystem",
            "setSampleMarkdownFiles",
          ],
          exit: ["clearMarkdownFiles"],
          on: {
            SIGN_IN: {
              target: "signedIn",
              actions: ["setGitHubUser"],
            },
          },
        },
        signedIn: {
          on: {
            SIGN_OUT: "signedOut",
          },
          initial: "resolvingRepo",
          states: {
            resolvingRepo: {
              invoke: {
                src: "resolveRepo",
                onDone: {
                  target: "cloned",
                  actions: ["setGitHubRepo", "setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                },
                onError: "notCloned",
              },
            },
            notCloned: {
              on: {
                SELECT_REPO: "cloningRepo",
              },
            },
            cloningRepo: {
              entry: ["setGitHubRepo", "clearMarkdownFiles", "clearMarkdownFilesLocalStorage"],
              invoke: {
                src: "cloneRepo",
                onDone: {
                  target: "cloned.sync.success",
                  actions: ["setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                },
                onError: {
                  target: "notCloned",
                  actions: ["clearGitHubRepo", "setError"],
                },
              },
            },
            cloned: {
              on: {
                SELECT_REPO: "cloningRepo",
              },
              type: "parallel",
              states: {
                change: {
                  initial: "idle",
                  states: {
                    idle: {
                      on: {
                        WRITE_FILES: "writingFiles",
                        DELETE_FILE: "deletingFile",
                      },
                    },
                    writingFiles: {
                      entry: ["mergeMarkdownFiles", "mergeMarkdownFilesLocalStorage"],
                      invoke: {
                        src: "writeFiles",
                        onDone: {
                          target: "idle",
                          actions: raise("SYNC_DEBOUNCED"),
                        },
                        onError: {
                          target: "idle",
                          actions: "setError",
                        },
                      },
                    },
                    deletingFile: {
                      entry: ["deleteMarkdownFile", "deleteMarkdownFileLocalStorage"],
                      invoke: {
                        src: "deleteFile",
                        onDone: {
                          target: "idle",
                          actions: raise("SYNC_DEBOUNCED"),
                        },
                        onError: {
                          target: "idle",
                          actions: "setError",
                        },
                      },
                    },
                  },
                },
                sync: {
                  initial: "pulling",
                  states: {
                    debouncing: {
                      after: {
                        1000: "pulling",
                      },
                      on: {
                        SYNC: "pulling",
                        SYNC_DEBOUNCED: "debouncing",
                      },
                    },
                    success: {
                      on: {
                        SYNC: "pulling",
                        SYNC_DEBOUNCED: "debouncing",
                      },
                    },
                    error: {
                      entry: "logError",
                      on: {
                        SYNC: "pulling",
                        SYNC_DEBOUNCED: "debouncing",
                      },
                    },
                    pulling: {
                      always: [
                        // Don't pull if offline
                        { target: "success", cond: "isOffline" },
                      ],
                      invoke: {
                        src: "pull",
                        onDone: {
                          target: "pushing",
                          actions: ["setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                        },
                        onError: "error",
                      },
                    },
                    pushing: {
                      always: [
                        // Don't push if offline
                        { target: "success", cond: "isOffline" },
                      ],
                      invoke: {
                        src: "push",
                        onDone: "checkingStatus",
                        onError: "error",
                      },
                    },
                    checkingStatus: {
                      on: {
                        SYNC: "pulling",
                        SYNC_DEBOUNCED: "debouncing",
                      },
                      invoke: {
                        src: "checkStatus",
                        onDone: [
                          {
                            target: "success",
                            cond: "isSynced",
                          },
                          // If not synced, pull again
                          {
                            target: "pulling",
                          },
                        ],
                        onError: "error",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      guards: {
        isOffline: () => !navigator.onLine,
        isSynced: (_, event) => event.data.isSynced,
      },
      services: {
        resolveUser: async () => {
          // First, check URL params for user metadata
          const token = new URLSearchParams(window.location.search).get("user_token")
          const login = new URLSearchParams(window.location.search).get("user_login")
          const name = new URLSearchParams(window.location.search).get("user_name")
          const email = new URLSearchParams(window.location.search).get("user_email")

          if (token && login && name && email) {
            // Save user metadata to localStorage
            localStorage.setItem(
              GITHUB_USER_STORAGE_KEY,
              JSON.stringify({ token, login, name, email }),
            )

            const searchParams = new URLSearchParams(window.location.search)

            // Remove user metadata from URL
            searchParams.delete("user_token")
            searchParams.delete("user_login")
            searchParams.delete("user_name")
            searchParams.delete("user_email")

            window.location.replace(
              `${window.location.pathname}${
                searchParams.toString() ? `?${searchParams.toString()}` : ""
              }`,
            )

            return { githubUser: { token, login, name, email } }
          }

          // Next, check localStorage for user metadata
          const githubUser = JSON.parse(localStorage.getItem(GITHUB_USER_STORAGE_KEY) ?? "null")
          return { githubUser: githubUserSchema.parse(githubUser) }
        },
        resolveRepo: async () => {
          const stopTimer = startTimer("resolveRepo()")

          const remoteOriginUrl = await getRemoteOriginUrl()

          // Remove https://github.com/ from the beginning of the URL to get the repo name
          const repo = String(remoteOriginUrl).replace(/^https:\/\/github.com\//, "")

          const [owner, name] = repo.split("/")

          if (!owner || !name) {
            throw new Error("Invalid repo")
          }

          const githubRepo = { owner, name }

          const markdownFiles =
            getMarkdownFilesFromLocalStorage() ?? (await getMarkdownFilesFromFs(REPO_DIR))

          stopTimer()

          return { githubRepo, markdownFiles }
        },
        cloneRepo: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")

          await gitClone(event.githubRepo, context.githubUser)

          return {
            markdownFiles: await getMarkdownFilesFromFs(REPO_DIR),
          }
        },
        pull: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")

          await gitPull(context.githubUser)

          return {
            markdownFiles: await getMarkdownFilesFromFs(REPO_DIR),
          }
        },
        push: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")

          await gitPush(context.githubUser)
        },
        checkStatus: async () => {
          return { isSynced: await isRepoSynced() }
        },
        writeFiles: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")

          const {
            markdownFiles,
            commitMessage = `Update ${Object.keys(markdownFiles).join(" ")}`,
          } = event

          // Write files to file system
          Object.entries(markdownFiles).forEach(async ([filepath, content]) => {
            // Create directories if needed
            const dirPath = filepath.split("/").slice(0, -1).join("/")
            if (dirPath) {
              let currentPath = REPO_DIR
              const segments = dirPath.split("/")

              for (const segment of segments) {
                currentPath = `${currentPath}/${segment}`
                const stats = await fs.promises.stat(currentPath).catch(() => null)
                const exists = stats !== null
                if (!exists) {
                  await fs.promises.mkdir(currentPath)
                }
              }
            }

            // Write file
            await fs.promises.writeFile(`${REPO_DIR}/${filepath}`, content, "utf8")
          })

          // Stage files
          await gitAdd(Object.keys(markdownFiles))

          // Commit files
          await gitCommit(commitMessage)
        },
        deleteFile: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")

          const { filepath } = event

          // Delete file from file system
          await fs.promises.unlink(`${REPO_DIR}/${filepath}`)

          // Stage deletion
          await gitRemove(filepath)

          // Commit deletion
          await gitCommit(`Delete ${filepath}`)
        },
      },
      actions: {
        setGitHubUser: assign({
          githubUser: (_, event) => {
            switch (event.type) {
              case "SIGN_IN":
                return event.githubUser
              case "done.invoke.global.resolvingUser:invocation[0]":
                return event.data.githubUser
            }
          },
        }),
        clearGitHubUser: assign({
          githubUser: null,
        }),
        clearGitHubUserLocalStorage: () => {
          localStorage.removeItem(GITHUB_USER_STORAGE_KEY)
        },
        setGitHubRepo: assign({
          githubRepo: (_, event) => {
            switch (event.type) {
              case "SELECT_REPO":
                return event.githubRepo
              case "done.invoke.global.signedIn.resolvingRepo:invocation[0]":
                return event.data.githubRepo
            }
          },
        }),
        clearGitHubRepo: assign({
          githubRepo: null,
        }),
        clearFileSystem: () => {
          fsWipe()
        },
        setMarkdownFiles: assign({
          markdownFiles: (_, event) => event.data.markdownFiles,
        }),
        setSampleMarkdownFiles: assign({
          markdownFiles: getSampleMarkdownFiles(),
        }),
        setMarkdownFilesLocalStorage: (_, event) => {
          localStorage.setItem(MARKDOWN_FILES_STORAGE_KEY, JSON.stringify(event.data.markdownFiles))
        },
        mergeMarkdownFiles: assign({
          markdownFiles: (context, event) => ({
            ...context.markdownFiles,
            ...event.markdownFiles,
          }),
        }),
        mergeMarkdownFilesLocalStorage: (context, event) => {
          localStorage.setItem(
            MARKDOWN_FILES_STORAGE_KEY,
            JSON.stringify({
              ...context.markdownFiles,
              ...event.markdownFiles,
            }),
          )
        },
        deleteMarkdownFile: assign({
          markdownFiles: (context, event) => {
            const { [event.filepath]: _, ...markdownFiles } = context.markdownFiles
            return markdownFiles
          },
        }),
        deleteMarkdownFileLocalStorage: (context, event) => {
          const { [event.filepath]: _, ...markdownFiles } = context.markdownFiles
          localStorage.setItem(MARKDOWN_FILES_STORAGE_KEY, JSON.stringify(markdownFiles))
        },
        clearMarkdownFiles: assign({
          markdownFiles: {},
        }),
        clearMarkdownFilesLocalStorage: () => {
          localStorage.removeItem(MARKDOWN_FILES_STORAGE_KEY)
        },
        setError: assign({
          // TODO: Remove `as Error`
          error: (_, event) => event.data as Error,
        }),
        logError: (_, event) => {
          console.error(event.data)
        },
      },
    },
  )
}

/** Get cached markdown files from local storage */
function getMarkdownFilesFromLocalStorage() {
  const markdownFiles = JSON.parse(localStorage.getItem(MARKDOWN_FILES_STORAGE_KEY) ?? "null")
  if (!markdownFiles) return null
  const parsedMarkdownFiles = z.record(z.string()).safeParse(markdownFiles)
  return parsedMarkdownFiles.success ? parsedMarkdownFiles.data : null
}

/** Walk the file system and return the contents of all markdown files */
async function getMarkdownFilesFromFs(dir: string) {
  const stopTimer = startTimer("getMarkdownFilesFromFs()")

  const entries = await git.walk({
    fs,
    dir,
    trees: [WORKDIR()],
    map: async (filepath, [entry]) => {
      if (!entry) return null

      // Ignore .git directory
      if (filepath.startsWith(".git")) return

      // Ignore non-markdown files
      if (!filepath.endsWith(".md")) return

      // Get file content
      const content = await entry.content()

      if (!content) return null

      console.debug(filepath, (await entry.stat()).size)

      return [filepath, new TextDecoder().decode(content)]
    },
  })

  const markdownFiles = Object.fromEntries(entries)

  stopTimer()

  return markdownFiles
}

export const globalStateMachineAtom = atomWithMachine(createGlobalStateMachine)

export const markdownFilesAtom = selectAtom(
  globalStateMachineAtom,
  (state) => state.context.markdownFiles,
)

export const isRepoNotClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.notCloned"),
)

export const isCloningRepoAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloningRepo"),
)

export const isRepoClonedAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedIn.cloned"),
)

export const isSignedOutAtom = selectAtom(globalStateMachineAtom, (state) =>
  state.matches("signedOut"),
)

// -----------------------------------------------------------------------------
// GitHub
// -----------------------------------------------------------------------------

export const githubUserAtom = selectAtom(
  globalStateMachineAtom,
  (state) => state.context.githubUser,
)

export const githubRepoAtom = selectAtom(
  globalStateMachineAtom,
  (state) => state.context.githubRepo,
)

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export const notesAtom = atom((get) => {
  const markdownFiles = get(markdownFilesAtom)
  const notes: Map<NoteId, Note> = new Map()

  // Parse notes
  for (const filepath in markdownFiles) {
    const id = filepath.replace(/\.md$/, "")
    const content = markdownFiles[filepath]
    notes.set(id, parseNote(id, content))
  }

  // Derive backlinks
  for (const { id: sourceId, links } of notes.values()) {
    for (const targetId of links) {
      const backlinks = notes.get(targetId)?.backlinks
      // Skip if the source note is already a backlink
      if (backlinks?.includes(sourceId)) continue

      // Skip if the source note is linking to itself
      if (targetId === sourceId) continue

      backlinks?.push(sourceId)
    }
  }

  return notes
})

export const pinnedNotesAtom = atom((get) => {
  const notes = get(notesAtom)
  return [...notes.values()].filter((note) => note.pinned).reverse()
})

export const sortedNotesAtom = atom((get) => {
  const notes = get(notesAtom)

  // Sort notes by when they were created in descending order
  return [...notes.values()].sort((a, b) => {
    // Favor pinned notes
    if (a.frontmatter.pinned === true && b.frontmatter.pinned !== true) {
      return -1
    } else if (a.frontmatter.pinned !== true && b.frontmatter.pinned === true) {
      return 1
    }

    // Favor numeric IDs
    if (a.id.match(/^\d+$/) && !b.id.match(/^\d+$/)) {
      return -1
    } else if (!a.id.match(/^\d+$/) && b.id.match(/^\d+$/)) {
      return 1
    }

    return b.id.localeCompare(a.id)
  })
})

export const noteSearcherAtom = atom((get) => {
  const sortedNotes = get(sortedNotesAtom)
  return new Searcher(sortedNotes, {
    keySelector: (note) => [note.title, note.displayName, note.content, note.id, note.alias || ""],
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------

export const tagsAtom = atom((get) => {
  const notes = get(notesAtom)
  const tags: Record<string, NoteId[]> = {}

  for (const note of notes.values()) {
    for (const tag of note.tags) {
      // If the tag doesn't exist, create it
      if (!tags[tag]) tags[tag] = []
      // If the note isn't already linked to the tag, link it
      if (!tags[tag].includes(note.id)) tags[tag].push(note.id)
    }
  }

  return tags
})

export const sortedTagEntriesAtom = atom((get) => {
  const tags = get(tagsAtom)
  // Sort tags alphabetically in ascending order
  return Object.entries(tags).sort((a, b) => {
    return a[0].localeCompare(b[0])
  })
})

export const tagSearcherAtom = atom((get) => {
  const sortedTagEntries = get(sortedTagEntriesAtom)
  return new Searcher(sortedTagEntries, {
    keySelector: ([tag]) => tag,
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// Dates
// -----------------------------------------------------------------------------

export const datesAtom = atom((get) => {
  const notes = get(notesAtom)
  const dates: Record<string, NoteId[]> = {}

  for (const note of notes.values()) {
    for (const date of note.dates) {
      // If the date doesn't exist, create it
      if (!dates[date]) dates[date] = []
      // If the note isn't already linked to the date, link it
      if (!dates[date].includes(note.id)) dates[date].push(note.id)
    }
  }

  return dates
})

// -----------------------------------------------------------------------------
// Templates
// -----------------------------------------------------------------------------

export const templatesAtom = atom((get) => {
  const notes = get(notesAtom)
  const templates: Record<string, Template> = {}

  for (const { id, content, frontmatter } of notes.values()) {
    const template = frontmatter["template"]

    // Skip if note isn't a template
    if (!template) continue

    try {
      const parsedTemplate = templateSchema.omit({ body: true }).parse(template)

      const body = removeTemplateFrontmatter(content)

      templates[id] = { ...parsedTemplate, body }
    } catch (error) {
      // Template frontmatter didn't match the schema
      console.error(error)
    }
  }

  return templates
})

export const dailyTemplateAtom = selectAtom(templatesAtom, (templates) =>
  Object.values(templates).find((t) => t.name.match(/^daily$/i)),
)

export const weeklyTemplateAtom = selectAtom(templatesAtom, (templates) =>
  Object.values(templates).find((t) => t.name.match(/^weekly$/i)),
)

// -----------------------------------------------------------------------------
// UI state
// -----------------------------------------------------------------------------

export const themeAtom = atomWithStorage<"default" | "eink">("theme", "default")

export const defaultFontAtom = atomWithStorage<Font>("font", "sans")

export const sidebarAtom = atomWithStorage<"expanded" | "collapsed">("sidebar", "expanded")

// -----------------------------------------------------------------------------
// AI
// -----------------------------------------------------------------------------

export const OPENAI_KEY_STORAGE_KEY = "openai_key"

export const openaiKeyAtom = atomWithStorage<string>(OPENAI_KEY_STORAGE_KEY, "")

export const hasOpenAIKeyAtom = selectAtom(openaiKeyAtom, (key) => key !== "")

export const voiceAssistantEnabledAtom = atomWithStorage<boolean>("voice_assistant_enabled", false)
