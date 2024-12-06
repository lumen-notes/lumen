import { Searcher } from "fast-fuzzy"
import git, { WORKDIR } from "isomorphic-git"
import { atom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { selectAtom } from "jotai/utils"
import { assign, createMachine, raise } from "xstate"
import { z } from "zod"
import {
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
import { checkIfPinned } from "./utils/pin"
import { removeTemplateFrontmatter } from "./utils/remove-template-frontmatter"
import { getSampleMarkdownFiles } from "./utils/sample-markdown-files"
import { startTimer } from "./utils/timer"

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const GITHUB_USER_KEY = "github_user"
const MARKDOWN_FILES_KEY = "markdown_files"

// -----------------------------------------------------------------------------
// State machine
// -----------------------------------------------------------------------------

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
  | { type: "WRITE_FILES"; markdownFiles: Record<string, string>; commitMessage?: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m0UNCyADC6FurwAogAZA-buk-HUHgAKd07IO9oHZi0xx05CcR0UszmFXn7ouDvjOHyEqxsu-AWmuGpSHuIhFmghqsOwzrcLwK61lBMH2roLbSG2Sgdh6QL3j2PoIF+Ni2BKOIuAs8LmMK0R2IG9iMQmYRfnylhgZc6E2tBLCwQ6pT4OUlTVHUjRmuBq65rg-EUIJ2HdHhfQEZoRHdqyj6IDYyh2LgezQsmcquDEMZuPpdhMdZyj2IKDjcaqObWnJe6QIeJ5nhe163oRTLDCR2kIPZL4SrE5gfl+wq+DKkQLks0QhAubFeI5EGyfJkByQAFlgVDGhAKBgAwADqOpvHSB4-AAYm8J4vHemngqRn64MoqROP+rjSlC0UKtYtnmFZlgShyn7pESNbOeurlGhAOV5TA7CFcVAAix4HpVNV1QejUBVppiIK1QH2DKUrmO1QGWNFcrTskwaDt10LmGlMkuZl81SLl+W4AA7vgoJUNVZBFbACHGshppTZBfFuZ931Lf9gNQMDoM4a6+HqH5Xb7c1QXQsobWMdK0S7HKNizNFw6RLM0QLpyumilxk1odNGFzQtP1I-IQMg3AwmiWWElVlJPFs7DHNfYtbDcyIqNwOjKnuup-ksnjh1kXGQYWQqn57HGcRU0xNNLOEsS-u1E3nNJvGzbcnNLRAYBFTzKN8+DSGcFDrMw3bWVSz9Tsu3LfOK70yuerjvauITjHxaZCz2NFiIDbGSVRJs3hDq9tsfQ7bBB2ArvywLpbiRWknQxlcP57ghfF6Hynh2pkdq72sYRBszjd5Y47eMn-YhLZsxLAqGxuFbyo2+LfvzbAgQUFIVwPFIUhwGDLwAJpfNue1t6RMrWJ+pN8vOYRjvRQShAcFF6UPvh2N45EZiz0++3n8+L7gJaMFvO97w+DWAY2rHChJ+dqThRzfivuMPkFFuo2CGkkWM0oc4zw-gvJe2gHgoBQCID2JpUJv2rhzT+WCcF4KoGHdsWMVY433kFYMhMUxOFSKAnkl81iLCiOKBc8whyLB1mg9+NcyFVAofgn+QsK4iyru9URmDxG4JENQzGADAoa2hPAqyMomLzFjAqYUSVu5BiHp1BIfIsTCJIfbMR2DlFUAYOog67JYzijiMkdqFkAzIiMamCiiCPCJTCoxRUr8xYiNIYo7BsBsr4OYIhQhosnKRNsdEh4sSVFNxoc49WYxLBJTavCZIQF+SLDpkYxw04UhWSlO4CMvdrHyKiV-GJcTHFSPLpWasPsbFZTsRk9pUBVGqVoa3QBrj9K+B8KTMcDhpQ2CMbKXAj8pR7DCKTIazgmkzQwa0wZ+DcnR0cAZewEwFgRSiFYIxrgti7EjL+MmqYJQ7PZmkr+X0wBSC4CIF4sg5AZIIZDIhES+lz0UZ875vz-myAySMiOGko6kSWDCX8dMRrSnCAzIxFN9KLAAuc3w9hXkS3eUvSFPyqB-IBWDBJEMvYgpSWCq4ELspfMpVAalsLYDwo7G4OhxEXGIFHrCCMDhUgGO7kKGBHU7mxD4Q-IcbgSWzxZR8tlUKqUwsBZ08s3TknpWaWSnK7LoU0t5WMxFDCNYxEJt3QUMp2KuGujK5B4oL7TF2DraEKq9nko1RyrlgK-672xoKvJkJUhTEFFYQccY5jREqccNqCYkgnCSBMF6SpNxO3gECEk4yNFjF9BPCIN9dKbHslKRKwpfTTgWEkMcMR-wosjK9BsHQxCFqFQgLW84lh7AzhMBU0C1iIO2AmPYopDjHBGjsx4shu0RuCgqcUyRe531jQsBiZb5hwl1hMUtJKl29hLTiTEyIK0ZpxAkaVaxOT6SsB4CmJSn2pXCUylyHasJoBPaROtbgDIym7mPBmUZJyRlhPMQ97hkiLCzdbUFLlNw7jhn+-Gq6jjJn3UxK5EHY7jiGuTQdyqP2Gt2ZhJsuh0NANXUOREqQPwWQpi6tY8QIj8kGvYWyDh32Ic-RRuaNHi02AouWpw17q3Rhgb4CMkRGYWV-I-CKfGp5IcE-bAOMBhN+mNjsVZ3hgyM2k2sPYFNMSM3agqZMRLfU1y0wVIqOn1jTmKTEBUVkjjIJuhsKYelSbyg-EsOzksEYywBg3UGzmowgN0u4fqY0JwyYcPpeI-nfARU-Nssjb0NP+zC3XZ2RcQ5OatRMxArhAMJUjPMBYFl3DRShNYKIVl06m2JiFslzn-SE3E5W-FCQTOhG8BRPYTgZSgODBMTr-TFGwBXmvWAebVbld7WJwJKIkrnxGkYm+bU5gpgsk-KcM3wVfx-s55rXrpgJhaxsBrMDH6rsCTx2MHhOSqbkXls75CHFQEu74IMU34gRh8L3Th18fADjgQcZE-JTtqvIZkqgl24iwgsoxEa0JDjbplciLYqzRNDSHMzfj5G3mzfVaarVNLnPnRWaZc2yIlWJplSiTEOIoS6SJ-EDIGQgA */
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
            data: { githubRepo: GitHubRepository; markdownFiles: Record<string, string> }
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
                          actions: raise("SYNC"),
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
                          actions: raise("SYNC"),
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
                    success: {
                      on: {
                        SYNC: "pulling",
                      },
                    },
                    error: {
                      entry: "logError",
                      on: {
                        SYNC: "pulling",
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
            localStorage.setItem(GITHUB_USER_KEY, JSON.stringify({ token, login, name, email }))

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
          const githubUser = JSON.parse(localStorage.getItem(GITHUB_USER_KEY) ?? "null")
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

          return { markdownFiles: await getMarkdownFilesFromFs(REPO_DIR) }
        },
        pull: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")

          await gitPull(context.githubUser)

          return { markdownFiles: await getMarkdownFilesFromFs(REPO_DIR) }
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
          localStorage.removeItem(GITHUB_USER_KEY)
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
          localStorage.setItem(MARKDOWN_FILES_KEY, JSON.stringify(event.data.markdownFiles))
        },
        mergeMarkdownFiles: assign({
          markdownFiles: (context, event) => ({
            ...context.markdownFiles,
            ...event.markdownFiles,
          }),
        }),
        mergeMarkdownFilesLocalStorage: (context, event) => {
          localStorage.setItem(
            MARKDOWN_FILES_KEY,
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
          localStorage.setItem(MARKDOWN_FILES_KEY, JSON.stringify(markdownFiles))
        },
        clearMarkdownFiles: assign({
          markdownFiles: {},
        }),
        clearMarkdownFilesLocalStorage: () => {
          localStorage.removeItem(MARKDOWN_FILES_KEY)
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
  const markdownFiles = JSON.parse(localStorage.getItem(MARKDOWN_FILES_KEY) ?? "null")
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
  const state = get(globalStateMachineAtom)
  const markdownFiles = state.context.markdownFiles
  const notes: Map<NoteId, Note> = new Map()

  // Parse notes
  for (const filepath in markdownFiles) {
    const id = filepath.replace(/\.md$/, "")
    const content = markdownFiles[filepath]
    notes.set(id, { id, content, ...parseNote(content), backlinks: [] })
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
  return [...notes.values()].filter(checkIfPinned)
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
    keySelector: (note) => [note.title, note.content, note.id],
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
