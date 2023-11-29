import { Searcher } from "fast-fuzzy"
import git, { WORKDIR } from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { atom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { atomWithStorage, selectAtom } from "jotai/utils"
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
} from "./types"
import { fs, fsWipe } from "./utils/fs"
import { parseNote } from "./utils/parse-note"
import { removeTemplateFrontmatter } from "./utils/remove-template-frontmatter"

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const REPO_DIR = `/repo`
const DEFAULT_BRANCH = "main"
const GITHUB_USER_KEY = "github_user"
const MARKDOWN_FILES_KEY = "markdown_files"
export const VIM_MODE_KEY = "vim_mode"

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
  | { type: "WRITE_FILE"; filepath: string; content: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m1gBraWSBV4AUQAMnuAMJ0n46vcABTunZB3tA7PstlTUPczminPcwq85hsuGUdhHCEHgynKcrLvwFprhqUjoBQIhFmghqsOwzrcLwK61jBcEIc23RtkoHYekCd49j6CCWMitgSjiLgLPC5jCtEdiBvYzEJmElF8pYEGXFhNqwSwuHFvg5SVNUdSNGakGrrmuCCfB9q6C20gEX0RGaCR3asg+iA8rgqYvq+yiLPCMZ7LCNg+HGH7Ym46REjWObWvJcGQPuR6nueV43sRTLDGRukIASz58q4HgftEX5BIgezeOK9ipoBcyjl4vGqs566uUaEDyQAFlgVDGhAKBgAwADqOpvHSe4-AAYm8R63tp4LkW4SyYgk3iLF1EXCh4yh-iECYJq+ljRMNPGOZhmXYTl+WFTA7AlWVAAih57jV9WNXuzUBTppixYBUw2OYDi-r175CjF6zQm4kThDYNhDgmE0SulUFyQpkALUVuAAO74KCVB1WQpXIcaaGmk50ECW5uVSAVf2A8DUCg6VKmuoR6h+V2+2tUFV2RKdnjMfy0LRjdModdyoELi4rgfbJLnfQjSNLSj8gg2DZUluJ5aVtWM2w9lty-RzQNc2jPOY2p7qaf5LIE4dFH9pRg6zAucb9T+WxRb+sZjhNexTecMn8aLP2I4tbAQGApVS+jZXMChJoYebs1w-N1t-XbDsiE7su9PLnr472yLKEGlEbEsnIRpy-VvbgDiAQuEpWWO5hMxbrPi7b9tgI7POlKJpYSRWUkw198N57gfuFwHMv4cHGmh0rvaWGd1EJFiaY+NEicSrCg2xji8SWKkpvKh7Iu57AgQUFIVwPFIUhwLArwAJpfMee3t+RziBgBiz2ZYUQmZ3-g3WEyTJ9KKaLj48LZ57lu5fPi+4HzW873v94qxMbuE9PDzAvrsYUWJAxQgWM4F+s8a4fyXtoB4KAUAiAhqhTg0NhbV3mogqoKC0FUCDu2HGCs8b7yCjELY9hrKTWDKPCBcY-yH0jMxSicDcFi3wcg1B6C+ZlkklWaSfFX5zwXkgwhIgSHYz-oFFWgprDJCnNEPY8JUzOAgdCCI7hNgOFgdNGeXCfo8KkVQBgciDrshiP+TuopJ7qKSBA1MkdBrSmhMGHEipDGiPgXgiRBDYB5XQS7SGWD3a+OMe-AJyCgnSObqQyxysxjuGsBGbwE8xyOM0dfDkMIgIGLNpElmCCYkPDieYgR5dBYiIyn47hZSKlQBkepMhbd-4pJ8LCRYP4ZRhFUU46+URpy-jOhwnxdSolXEacE8xSTezJhhMBfETgpQTWRFoky-5Rx7EKdPYpWVxGf0RmAKQXARAvFkHIcpGC3a1M+iU-xxy8qnPOVQS51zYAtJDlpMO5FfRij5HoyiEDdhcmGtMY4xwTLtU4Y8hpzzXkXKubIG5oTMHoXuczQ5pTEVnORZ875HY3DkNIlY2KAFxTJnYTktYixfy2BYjSuFOKnlLxOfi95KKblVIFpXHB8KTEBI5W8qAHzUVfISbI3GZLkmhHfDOBwBwTLJgmIxXJ8wgw-m6gYokFA0B23gECEk7T5FjABcGLV8J2GLCivMYUAKgzwmRJRTuUpBRpQmbkIQjZOimvJQgOMydgJLBNqq2Mgy1inW2AmPYopDjHE7iyx4sh-VyuCgqcUyQz7HysHCJiEQwjQNtRNRcWcvXYopGm3sAL7JWumEqhUE8Jw3U5HYGcMo5zAUXFPKuLkGzCTQNW-5wEDKdsOKozkkZYyTkjN0hYqSQL0pZRqTc241iKw6ZCY4kQTJyjCpFaKawI5TFnMfBcp8V1e0Uk2XQw7CZQmTlYKycd7DjRsMKZ6WwAKImGe4ex5aimTMFRAe9KtfT03rTapt9qqbwhhNKSMgowgJCWBmCtOca4+xgGB81BwpjUocBGeEAprprHatGo4SGwipGYoiK9b9a5kBWrh0I04AKxAWA-GFv5+qeCGiNOUrhxqTQY7nbDbBOaN1Kqx4KsRIjBgAnMAMKIB5UysPdRDMDdheLE1h9m+d-bcxk78yhCjpQGUAmEOIKmlhqfI+rf8IZgLCYmnEPTbLZMQbCFBxtdqW10o2NOZE7jgyzBiB5hFS9YArzXrAI1m6zV+k7r5ieMGAtsdvqGh+9kn7eKAw81lUWv6l3wF5x9DgnBLGssAjZ18fzWCcPEXZkWhWf14UQqAsngEGSSMkYM-SNEQOVbYsm59fD5f2cBorbXJFNO66OhMjhxpqIGbS0IyZI6ht2TpiLGGxG4vZS8zlYruUJYoVu8YT1k7vn0Uwj8BlgLAt1WkIAA */
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
          writeFile: {
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
                  target: "cloned",
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
                        WRITE_FILE: "writingFile",
                        DELETE_FILE: "deletingFile",
                      },
                    },
                    writingFile: {
                      entry: ["setMarkdownFile", "setMarkdownFileLocalStorage"],
                      invoke: {
                        src: "writeFile",
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
              `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""
              }`,
            )

            return { githubUser: { token, login, name, email } }
          }

          // Next, check localStorage for user metadata
          const githubUser = JSON.parse(localStorage.getItem(GITHUB_USER_KEY) ?? "null")
          return { githubUser: githubUserSchema.parse(githubUser) }
        },
        resolveRepo: async () => {
          console.time("resolveRepo()")

          // Check git config for repo name
          const remoteOriginUrl = await git.getConfig({
            fs,
            dir: REPO_DIR,
            path: "remote.origin.url",
          })

          // Remove https://github.com/ from the beginning of the URL to get the repo name
          const repo = String(remoteOriginUrl).replace(/^https:\/\/github.com\//, "")

          const [owner, name] = repo.split("/")

          if (!owner || !name) {
            throw new Error("Invalid repo")
          }

          const githubRepo = { owner, name }

          const markdownFiles =
            getMarkdownFilesFromLocalStorage() ?? (await getMarkdownFilesFromFs(REPO_DIR))

          console.timeEnd("resolveRepo()")

          return { githubRepo, markdownFiles }
        },
        cloneRepo: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const githubRepo = event.githubRepo
          const url = `https://github.com/${githubRepo.owner}/${githubRepo.name}`
          const { login, token, name, email } = context.githubUser

          // Wipe file system
          // TODO: Only remove the repo directory instead of wiping the entire file system
          // Blocked by https://github.com/isomorphic-git/lightning-fs/issues/71
          fsWipe()

          // Clone repo
          // This could take awhile if the repo is large
          console.time(`$ git clone ${url}.git ${REPO_DIR}`)
          await git.clone({
            fs,
            http,
            dir: REPO_DIR,
            corsProxy: "https://cors.isomorphic-git.org",
            url,
            ref: DEFAULT_BRANCH,
            singleBranch: true,
            depth: 1,
            onMessage: console.log,
            onAuth: () => ({ username: login, password: token }),
          })
          console.timeEnd(`$ git clone ${url}.git ${REPO_DIR}`)

          // Set user in git config
          console.log(`$ git config user.name "Cole Bemis"`)
          await git.setConfig({
            fs,
            dir: REPO_DIR,
            path: "user.name",
            value: name,
          })

          console.log(`$ git config user.email "colebemis@github.com"`)
          await git.setConfig({
            fs,
            dir: REPO_DIR,
            path: "user.email",
            value: email,
          })

          const markdownFiles = await getMarkdownFilesFromFs(REPO_DIR)

          return { markdownFiles }
        },
        pull: async (context) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { login, token } = context.githubUser

          console.time(`$ git pull`)
          await git.pull({
            fs,
            http,
            dir: REPO_DIR,
            singleBranch: true,
            onAuth: () => ({ username: login, password: token }),
          })
          console.timeEnd(`$ git pull`)

          const markdownFiles = await getMarkdownFilesFromFs(REPO_DIR)

          return { markdownFiles }
        },
        push: async (context) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { login, token } = context.githubUser

          console.time(`$ git push`)
          await git.push({
            fs,
            http,
            dir: REPO_DIR,
            onAuth: () => ({ username: login, password: token }),
          })
          console.timeEnd(`$ git push`)
        },
        checkStatus: async () => {
          const latestLocalCommit = await git.resolveRef({
            fs,
            dir: REPO_DIR,
            ref: `refs/heads/${DEFAULT_BRANCH}`,
          })

          const latestRemoteCommit = await git.resolveRef({
            fs,
            dir: REPO_DIR,
            ref: `refs/remotes/origin/${DEFAULT_BRANCH}`,
          })

          const isSynced = latestLocalCommit === latestRemoteCommit

          return { isSynced }
        },
        writeFile: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { filepath, content } = event

          // Write file to file system
          await fs.promises.writeFile(`${REPO_DIR}/${filepath}`, content, "utf8")

          // Stage file
          console.log(`$ git add ${filepath}`)
          await git.add({
            fs,
            dir: REPO_DIR,
            filepath,
          })

          // Commit file
          console.log(`$ git commit -m "Update ${filepath}"`)
          await git.commit({
            fs,
            dir: REPO_DIR,
            message: `Update ${filepath}`,
          })
        },
        deleteFile: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { filepath } = event

          // Delete file from file system
          await fs.promises.unlink(`${REPO_DIR}/${filepath}`)

          // Stage deletion
          console.log(`$ git rm ${filepath}`)
          await git.remove({
            fs,
            dir: REPO_DIR,
            filepath,
          })

          // Commit deletion
          console.log(`$ git commit -m "Delete ${filepath}"`)
          await git.commit({
            fs,
            dir: REPO_DIR,
            message: `Delete ${filepath}`,
          })
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
        setMarkdownFile: assign({
          markdownFiles: (context, event) => {
            const { filepath, content } = event
            return { ...context.markdownFiles, [filepath]: content }
          },
        }),
        setMarkdownFileLocalStorage: (context, event) => {
          const { filepath, content } = event
          localStorage.setItem(
            MARKDOWN_FILES_KEY,
            JSON.stringify({ ...context.markdownFiles, [filepath]: content }),
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

/** Retrieve cached markdown files from local storage */
function getMarkdownFilesFromLocalStorage() {
  const markdownFiles = JSON.parse(localStorage.getItem(MARKDOWN_FILES_KEY) ?? "null")
  if (!markdownFiles) return null
  const parsedMarkdownFiles = z.record(z.string()).safeParse(markdownFiles)
  return parsedMarkdownFiles.success ? parsedMarkdownFiles.data : null
}

/** Walk the file system and return the contents of all markdown files */
async function getMarkdownFilesFromFs(dir: string) {
  console.time("getMarkdownFilesFromFs()")
  const markdownFiles = await git.walk({
    fs,
    dir,
    trees: [WORKDIR()],
    map: async (filepath, [entry]) => {
      // Ignore .git directory
      if (filepath.startsWith(".git")) return

      // Ignore non-markdown files
      if (!filepath.endsWith(".md")) return

      // Get file content
      const content = await entry?.content()

      if (!content) return null

      return [filepath, new TextDecoder().decode(content)]
    },
  })
  console.timeEnd("getMarkdownFilesFromFs()")

  return Object.fromEntries(markdownFiles)
}

/** Retrieve vim keybindings setting from local storage */
export const getVimModeFromLocalStorage = () => {
  const enabled = localStorage.getItem(VIM_MODE_KEY) ?? "false"
  return enabled === "true"
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

export const rawNotesAtom = atomWithStorage<Record<NoteId, string>>("raw_notes", {})

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
