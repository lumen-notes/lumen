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
import { fs } from "./utils/fs"
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
  | { type: "PUSH" }
  | { type: "WRITE_FILES"; markdownFiles: Record<string, string>; commitMessage?: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m1gBraWSBV4AUQAMnuAMJ0n46vcABTunZB3tA7PstlTUPczminPcwq85hsuGUdhHCEHgynKcrLvwFprhqUjoBQIhFmghqsOwzrcLwK61jBcEIc23RtkoHYekCd49j6CCWMitgSjiLgLPC5jCtEdiBvYzEJmElF8pYEGXFhNqwSwuHFvg5SVNUdSNGakGrrmuCCfB9q6C20gEX0RGaCR3asg+iA8rgqYvq+yiLPCMZ7LCNg+HGH7Ym46REjWObWvJcGQPuR6nueV43sRTLDGRukIASz7RO44ZLG+wobHykTSkObgOM4hwSrxqrOeurlGhA8kABZYFQxoQCgYAMAA6jqbx0nuPwAGJvEeLy3tp4LkWF-6pE4oqvtKULRQq1jKDY5iAZYEocmFDnnDJ-FZbceUFTA7DFaVAAih57tVdUNXuzUBTppiIO1772DKUrmCZ76WNFcrTskwaDq4kY-mlUFyQpkALYVuAAO74KCVC1WQJWwMhxpoaaTnQQJbk5VI+XfX9ANQEDIMqa6hHqH5Xb7a1QXQso-7MdKH7HEm0ZBIgHgsZEszRAunI2BxPGOZhGXYdlX1LUj8iA8DcClKJpYSRWUlQ+9sNc2wPMiKjcDo2p7qaf5LJ44dFFxkGiUKmFexxnE0XDrTSzhLEP4mVNyozezMOc-Di1sBAYAlbzKP82DqGcJDbPQ3Nn3299Tsu7L-MK70SuerjvauITzELixUQLPY0WIoNsbAVEmzeEOr2yS5H1wwjS1B2Arty4LYllpJVbSXxNt+4XDu4CXZeh-h4caZHqu9rGEQbMlrjjt4Kf9iEQ2zEsCobPZuezQXVyBBQUhXA8UhSHAoMvAAml8x57d35EytYYUfny85hGOjGU+MBx-gBY++HY3iUYis-1-PsCL8vJaMNvu-7-edWAZ-xkyuiZJwo5nDCnhFKWE8RhoKijNKN+vsP5fyqA8FAKARAexNBha2qDJafyXhgrBIgw7tixsrHGB8grBkJimJwqQyY8ivmsRYURxQLnmEORY2sUES05sQ5e2hMHYKoBXYW5ZKzVh9oI+awjSHiKgBQzGADArq2hH+Q4RxZiCnlAqaBHhAwLAgb+GYWIBH5yIeg0RZCJHqIOuyWM4o4jJBMolAMyIjERmoh4aI4ROTMUVKzAh8jPqKNEbAXKODmAoTwbXdKhChG2IeNE8h7dKGOLVmMSwwEOpJH8fyRY9NoGOGnCkQCUp3ARksCzaaddkkKNSekiRP8q6ixruLaxKSSFRJiVQVR6kqFd0Ac4uwBkZSpl-LGeI9loGylwE-KUewwgfhGs4KxmU0F9LSQMqADBsnR0cAZewEwFgzJ-Nda+WIti7GehKY40zzBbI5s0kh8MwBSC4CIF4sg5BpNwRDfBjTwk5UUZ875vz-myDSUMiOWko7kSWDCH89MxrSkCRGaBVkJmLGDHsKIvh7CvNtu85ekKflUD+QC0GcTwZexBUksFC8Pm5S+VSqANLYWwHhR2Nw1DSJOMQJPWEEYHCpFjCxQUOLNjiliNwx+CVSUN1ZRS9lULqUwsBe0kWMjElvR6eSvKHLoW0r5SMxFtD1YxEJgPYC9FKJ1OgUkawMygm7G1tCDIRIKBoCdvAIEJJRkaLGL6eyERb5M02IKHECQhTX19NOBYfJEobDlN4McmzQmXAbB0MQIbhUIE1vOJYhLkwTEQcKYa2wEx7FFIcY4Y0tmPFkIWnJiBDh3OSHU++Vg4RMUjfMOEOsJgRtJe23s4acSYmRNGpI+L43Ck5BMqwMpwiWHRbrFVealJoEneRJNbhJlQi7eGSMsZJyRlhPMMdb49YvJzcylym5txrBVmMyExxIgmTlHyd8n5-DX2RLHWc98Fz2XqVbUFRrhL7qtZ+4KUIllWCskE+wm6bDVrlQBVOCx3CinCCqguB6gq+hsH+KNTgF1xuYtFVMf54gATTMiKIltunbMlgHGApH1a+hpjsZZ3hgxMxGtFVIMJOoNtSFZfExGuNFyKiVXjYwLLwmhMEwCRxXU3Q2FMZjcpYyImJvJu2infr-VbiDFTnaXEpiZu4AaE0JzX0Si4pjU9jgJEoqZ+a3HHbO1LiHZTCHQ22ePUsCM+iFhuaA2sGUrhjbziM-CJYvmIlfxswgf0hMqMxsXXRm5mbJlpmYjEHY6XwXoNgKvdesBA0frC8Wyjw17Im1WZfaBt9-xzBTIlZ+U5KtqtwD-LL1gxq+GmAmKIRw4hxZFcxvxQ0HBHGc0NyJYiRBjd8EGYMEwEhWQXGNLrPgBx8kRMlKyUGONvIy7s1pUAxtxFhIlZiY1oSHAWNA5EWxlkUZGkOa7cijV3fVaarVtKsvnSWa4W1UIma8hxUsTEOJ4dDWGvEH1aQgA */
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
          entry: ["clearGitHubUser", "clearGitHubUserLocalStorage"],
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
                onError: "empty",
              },
            },
            empty: {
              on: {
                SELECT_REPO: "cloningRepo",
              },
            },
            cloningRepo: {
              entry: "setGitHubRepo",
              invoke: {
                src: "cloneRepo",
                onDone: {
                  target: "cloned.sync.success",
                  actions: ["setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                },
                onError: {
                  target: "empty",
                  actions: "setError",
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
        setMarkdownFiles: assign({
          markdownFiles: (_, event) => event.data.markdownFiles,
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
    notes.set(id, { id, content, ...parseNote(id, content), backlinks: [] })
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

export const sortedNotesAtom = atom((get) => {
  const notes = get(notesAtom)

  // Sort notes by when they were created in descending order
  return [...notes.values()].sort((a, b) => {
    // Put numeric IDs first
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
