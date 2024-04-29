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
  | { type: "WRITE_FILES"; markdownFiles: Record<string, string>; commitMessage?: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m1gBraWSBV4AUQAMnuAMJ0n46vcABTunZB3tA7MWmOOnITiOilmcwq8-dFwd8zh8hKsbLvwFprhqUjoBQIhFmghqsOwzrcLwK61pB0Gwc23RtkoHYekCd49j6CCfjYtgSjiLgLPC5jCtEdiBvYDEJmEn58pYoGXOhNpQSwWHFvg5SVNUdSNGaYGrrmuB8TB9q6C20i4X0+GaIR3asg+iA2Modi4Hs0LJnKrgxDGbh6XYjFWco9iCg4XGqjm1oydBkD7kep7nleN4EUywzEVpCB2c+EqxOY76fsKvgypEC5LNEIQLqxXgOeB0myZAMkABZYFQxoQCgYAMAA6jqbx0nuPwAGJvEeLy3hp4IkR+uDKKkTh-q40pQlFCrWDZ5iWZYEoch+6REjWTnri5RoQNluUwOwBVFQAIoee4VdVtV7g1-maaYiAtYB9gylK5htYBlhRXK07JMGg5ddC5ipVJzkZXNUg5XluAAO74KCVBVWQhWwAhxrIaak0QbxrkfV9i1-QDUBAyDimunh6i+V2e1NYF0LKK1DHStEuxyjYsxRcOkSzNEC6cjpoqcRNaFTRhs3zd9iPyIDwNwKUQmlqJFbiVD6WwxzCP-dzyO87AaPKe6al+SyuMHaRcZBuZCofnscZxJTjHU0s4SxD+bXjeckk8TNtwS2wEBgIV0so0VzCISaqFW6zMPs59C3247YDO7z8u9Irno472rgEwxcUmQs9hRYi-WxolUSbN4Q4vdb7127gDtOyILv88JZZiVWEncd7NuZX730F0HRchzhYeqRHKu9rGEQbM4veWOO3hJ-2IQ2bMSwKhsbgW8qXvQzXc2wIEFBSFcDxSFIcCgy8ACaXzHrtHckTK1gfiTfLzmEY50UEoQHORukj74djeGRGbM7PYvs4vy+4CWjA73vA+941YBlascKEH42pOFHF+G+4w+TkS6jYQaSRYzSmztXXO38V7aAeCgFAIgwZIU4JDFmc8sFLxwXgghVBQ7tkxkrbGh9ArBgJimJwqRwE8mvmsRYURxQLnmEORYWsMHkPFtgqo1DCF-zLsLCuos3oSMoVI-BIg6EYyAQFNW0JEGWRlIxeYsYFTCkSr3IMI8OoJD5FiMRn9baSNwWoqgDAtH7XZLGcUcRkhtXMgGZEpjUzkWQR4BKoUGKKnflXcRX8VG4NgFlQhbtwYkM9tE+xmVHEPASeolu9C3GqzGJYRKrV4TJEAvyRYtNTGOGnCkSyUp3ARn7nYpRsSf7xMSS42RQtKzVjIRkhecTsldKgBolSDD27AI8XpXwPgSZjgcNKGwpjZS4GflKPYYQSaDWcK06aFCOkjMIQUqOjh9L2AmAscKUQrCmNcFsXYkYfyk1TBKfZbMHEqM+mAKQXARAvFkHIbJRCPaV0cjEr5P8fl-IBUC2Q2Txnh3UpHEiSwYQ-lpsNaU4R6amPJnpRY-4rm+HsB8n2UKV4wv+VQQFwLQbJOIShcFaU2mUuyr8mlUA6UIrlnkzRbhGFEXcYgcesIIwOFSMY3uQo4HtUebEQRT8hxuHJfPK43ysqcrhfSkugtyx9JZa9A5yjoVathbS+FiL+UTNOSRGIBNe6ChlGxVwV05WoPFFfaYuwtbQjVYcql5quU8pBQA-eWNhWFMhKkKYgorCDjjHMaINTjitQTEkE4SQJjPSVBQNADt4BAhJFM7RYxfRTwiHfHSmw7JSgSsKX004FhJFssGQawZyZv0tpcBsHQxClpFQgDW84lh7HThMBUsC1jIO2AmPYopDjHGGvsx4shB3RqCgqcUyR+4PwTQseiVb5hwm1hMSt5KN29grTiTEyIa3ZpxAkWVaxOR6SsDKVwU9kRQk-Gqvt8k0BXpIk2tw+lP2HFpvTKMk5IywnmOe9wyRFi5p7RC6Sm5txrGVtMxAvd4wfjmAkWYP5LAprgciGOs4jj9x8MUgNmFAPAcCig1qU5UjvnMuTd1ax4gRH5ANewNkHApSiehtlkBmNq19DYci1anCPvrdGOBvgIyRB0g4YaJxHB7LE6yk1vt4ZgCk+Ww2OwNneE7QmZTaw9jk0xAzSzkZfABgY4Z-2S1ComcQHsTESQYgKkskcVB10NhTF0iTeU74lhudtnXSWSMXZFpw2WvDniUw6XcH1UaE4VMOD0vECLLmEh-r08az5tcjP50DsHLzKLmE6MmPFSM8wFjmXcFFX9Rt5xoPhDFsrOdTVSG8wgf0BN5O1qJQkGzoRvDkT2B1Mx6KmZof0xVoZP9YBrw3rAZLTDcPDrkyElEiVL7DVMXfVqcwUzmRflOWLmSVF-xG9YYaqmwpRCOHEfwcDn7bpCcJ2MHhOSidW+Vilj2jnOKgC93wQZgwTASOTBc525XzDAxAqUBwf0rZnukiTG2qE5KoC9uIsJzIMWGtCQ4h65XIi2Bs2Tg0hy48UQZ9l1KdW8pG2ddZJlTaUd5PipYmIcRQh0kz+IGQMhAA */
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
              entry: ["setGitHubRepo", "clearMarkdownFiles", "clearMarkdownFilesLocalStorage"],
              invoke: {
                src: "cloneRepo",
                onDone: {
                  target: "cloned.sync.success",
                  actions: ["setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                },
                onError: {
                  target: "empty",
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
