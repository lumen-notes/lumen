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
import {
  Config,
  CONFIG_FILE_PATH,
  DEFAULT_CONFIG,
  normalizeDirectoryPath,
  parseConfigFromJson,
  serializeConfig,
} from "./utils/config"
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
const CONFIG_STORAGE_KEY = "lumen_config" as const

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
  | {
      type: "WRITE_FILES"
      markdownFiles: Record<string, string | null>
      commitMessage?: string
    }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEEPdcaOmvOxCvELt7BwDghDdlaNtHczdwkOc7Nys7DKz0HNx9KFYIAHkAV1kGAGUASQBxADkAfTevgZIEBDAwKCijRBeZxeXDQkKxGzhZz2BKrUJHXAHRx2KEbBLI06ZEAtPDXW5vCivT6-O7UAAqgJ0elBRiBY2c5i2HiiyWiXnizhCaIQ5nCuHMuy8NjcPnM-Ls0TOxIuAjJkApgnywioACUwLomCw2JIeM0VaSyDd1RRNe1dfq0BIKJwemD+mpBsyRmzEABaczOXBeWaihLHaI2Vx2YWWOwRZQBqVeZRuabxEJKklXS3km1tbVQPUGsoVKo1WT1fBNLNqiAa-OFQsOp0uuRutSM4FesEQ8ZWIOC5SHQ5xGzuLzC5EhcXjzxzNzuMeZ83Zq11m0UNCyADC6FurwAogAZA-buk-HUHgAKd07IO9oHZi0xx05CcR0UszmFXn7ouDvjOHyEqxsu-AWmuGpSHuIhFmghqsOwzrcLwK61lBMH2roLbSG2Sgdh6QL3j2PoIPENi2BKOIuAs8LmMKsSBhMHhJAk-52IS5zgauua4NBLCwQ6pT4OUlTVHUjRmtx6E2vxFCCdh3R4X0BGaER3aso+iA2Modi4Hs0LJnKrgxDGbh6Rxw52Mo9iCg4YGXDJfF7pAh4nmeF7XrehFMsMJFaQgdkvhKsTmB+X7Cr4MqRAuSzRCEC4JvMDmqjm1rOUaEB8QAFlgVDGhAKBgAwADqOpvHSB4-AAYm8J4vHeGngqRn64MoqROP+rjSlCkUKtYNnmBxlgShyn7pESNZpeuGW3DleUwOwhXFQAIseB6VTVdUHo1fmaaYiCtUB9gylK5jtUBliRXK07JMGg7ddC5gpRBvFyZA835bgADu+CglQ1VkEVsAIcayGmlNkGyS5WVSLlX2-f9UCA8DOGuvh6g+V2e3NQF0LKG10RLKmuxyjYsyRcOkSzNEC6cjpoqWC9PHpe9sPw4tiPyADQNwMJollhJVZSY500YZln2c393PI7zsBo8p7pqb5LK4wdZFxkG5kKp+exxnElN2IGURLOEsS-u1E1caLUOzR9cMLWwEBgEVMso8VzCISaqHSWL0MSw7X3O67IjuwrvRK56OO9q4BNE7FJkLPYkWIgNsYJVEmzeEOzNOWzktOy7YBu7z-OluJFaSZDb0wwXuDB8Xoe8+H7aY8r2Oq72sYRBszh95Y47eCn-YhDZsxLAqGxuFbyq+7b+ewIEFBSFcDxSFIcAgy8ACaXzbrtnekR4ek6eEewRvEST0UE6Lmfp1l8sBTi00zk1oX7dtZYvy+r+vm+vLvbcPw1oACFaR7wPCtA+D51ajzcJEDkiwgIJjhEOYUYRkRtTmCmcy3gvyIlzh-BeS8V4lkYDvPe0D-Lqw5JiU+PgOQmzxN+G+CAjjxFhFYICCoozSkIfPWu39SEiQqAAvewCDxgOoBAqBWNiL7TGAGSiDhPBODUU4CcrCjjzExLTYM+iDHOH4TXCWQj65gAwGgB4y8RBiP3nIpqXc5h0OSHCFhaxFi7EiLpPYnJpj+KMW-OeJi5pmOdpY6xUhbEUKAaA8B25IFUIUdpSw04pRhD0QY-k6DR4wg5KdLJ-JjGs0ESQ8xESbFUAYCYWAsg5BsCwLUWQ9AAAUGwnAAEoGDVxKaYsp4SrGVKgEktWYx4gRAHhdRwY4EhRHQQqCIY5AnW1SgIvpP9tAPBQCgWxnswacAhu-NZoSymbO2SIFuGMRm9hiIGOIA8cRhWfjYGw6CFjwOhPYdq08IzFJmsQjZWydlVLIYLSuwsen-NKYC85VBLkqTblHQ+AUGG4FNpyPxY5fxXVYQcTBDg5j7AOMNP54sTkwuBVABg1zSKykxJM+Y4QsVWHQckCi08Uxxl8MGbwyzZ42xCR9MxmzYDZV2UaJCByfYCt6eSleIqxVwqUhHVSSKYFjOhITVJUpoRJDxOg6InJMQ6vJmOVMY5X4rNerKoVpyHiitsaCiulZqxHMFV-O1DqlXIXRgimlKKnCwn5BMWY9hGLRHQS8wMrhkQCiWFCKwpL-ZyqqPaxVVL-XqzpRMRwjKwpRBZbimwQ1772DjeTRhSbP5XDKXDMAUguAiBeHU2Q9rQaSpQiLVZ7qa0-zrQ2ptLb7XwsjupaOpFPDTjmIKRY-J3DuMQNg6chq-HHAStKBcVaAUr37Y2qgza5Btr2R2w5wSbUer7dlete6oAHtbfLZVrdFBuHbvI0Z2kdHT3eYiHwi4I1aNHsukKtNRTT18Ja-l3bz29p3Vegd+6h0gydeWF1XbrVQvWbB69g7D0Pp9YrVVY7kXq1SYGWmOlXCD00WsOYkxclm12NrLwW7oVYfg7exDdjM1jCSHk1J8wpSOE2HyYU1k+6RE5CNC2PhDUscwzlbDCHcN2IkVImR3HDqatcQsBdbC9gwnhAUwpgSiSbmdvAIEJI1XULGL6BcWwdjWWTPohm0ZWG+jSfCWNrgyaCjlMzBsHQxDWeSWwiI85iYhvarGJIwpi3bATL44lxwRp-MeLIEL77AoKnFMkSZcwuELAYhEMIUIFg62YsWpNmXex2YxI57OLmExubWJyPSVgZRDTJnsdwVbAtYTQDV0iHn4Hcr7pPemUZJyRlhIy9w869bPSCTKmam4dwwyG3jHLRxkxwksgW6bcdxxdalD1twcn5IDc2+rIaWwhyIlSB+cy5McVrHGUGaZYVrJluY8tqDGHbjXds-YbxQ1GvBlc5Fc1kQdKT2OLMvlkKyX2w5mAIHfojag6c94CHzXIqpAM7D2m8PPyI7ddBwOi0yDLXR+sacXmYgKg4kcJIr3EDHA2FMXShr5QfiWBdlHjsfrSybsDWnUY2ocvcP1Ma1H2cEph9z3wYVScC-ZkLhuJciri8mHFSMAmEoOH8KwmUrhqYcQzqbImM8kfJttcvWnvprJTHjl+JIs6EgtdCL4O7kpClFL++h5HF6V6wDXhvWAFmVbqsXRRVIuwUQJTCGOa+HiDgUV0nA3B-Ipxq5g7gMhtOFxtW8Iic6VhZgbDZ2ws+mIhzBkcL+F5yVA8swB-bleAzIkiFpyNaNco+QKh5XL8YEwKLFoDL4Jz+CMyt7zqx1NsKoC97lJEDiF8WfJBsqy7wtgq9EsOPZOfRCF8Kp70RmPZFRSwh6gGS+5NYtFs1nf+Kl1Z0Qdt9Wsxu6cP3t76mcUYlCMaYZ7QUUTGyCyLFNMPuY4EzNIIAA */
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
              entry: "logUser",
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
                    debouncing: {
                      after: {
                        1000: "pulling",
                      },
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
          const searchParams = new URLSearchParams(window.location.search)
          const token = searchParams.get("user_token")
          const id = searchParams.get("user_id")
          const login = searchParams.get("user_login")
          const name = searchParams.get("user_name")
          const email = searchParams.get("user_email")

          if (token && login && name && email) {
            const idNumberRaw = id ? Number(id) : undefined
            const idNumber = Number.isFinite(idNumberRaw) ? idNumberRaw : undefined

            // Save user metadata to localStorage
            localStorage.setItem(
              GITHUB_USER_STORAGE_KEY,
              JSON.stringify({ token, id: idNumber, login, name, email }),
            )

            // Remove user metadata from URL
            searchParams.delete("user_token")
            searchParams.delete("user_id")
            searchParams.delete("user_login")
            searchParams.delete("user_name")
            searchParams.delete("user_email")

            window.location.replace(
              `${window.location.pathname}${
                searchParams.toString() ? `?${searchParams.toString()}` : ""
              }`,
            )

            return { githubUser: { token, id: idNumber, login, name, email } }
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

          const entries = Object.entries(event.markdownFiles)
          const filesToWrite = entries.filter(([, content]) => content !== null)
          const filesToDelete = entries.filter(([, content]) => content === null)
          const fileList = entries.map(([filepath]) => filepath)
          const commitMessage = event.commitMessage ?? `Update ${fileList.join(" ") || "notes"}`

          // Write files to file system
          for (const [filepath, content] of filesToWrite) {
            if (content === null) continue

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
          }

          // Delete files from file system
          for (const [filepath] of filesToDelete) {
            await fs.promises.unlink(`${REPO_DIR}/${filepath}`).catch(() => null)
          }

          // Stage files
          const filesToAdd = filesToWrite.map(([filepath]) => filepath)
          if (filesToAdd.length > 0) {
            await gitAdd(filesToAdd)
          }

          for (const [filepath] of filesToDelete) {
            try {
              await gitRemove(filepath)
            } catch {
              // Ignore if the file isn't tracked
            }
          }

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
                // Save to localStorage when signing in directly (e.g., with PAT)
                localStorage.setItem(GITHUB_USER_STORAGE_KEY, JSON.stringify(event.githubUser))
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
          markdownFiles: (context, event) => {
            const merged = { ...context.markdownFiles }
            for (const [filepath, content] of Object.entries(event.markdownFiles)) {
              if (content === null) {
                delete merged[filepath]
              } else {
                merged[filepath] = content
              }
            }
            return merged
          },
        }),
        mergeMarkdownFilesLocalStorage: (context, event) => {
          const merged = { ...context.markdownFiles }
          for (const [filepath, content] of Object.entries(event.markdownFiles)) {
            if (content === null) {
              delete merged[filepath]
            } else {
              merged[filepath] = content
            }
          }
          localStorage.setItem(MARKDOWN_FILES_STORAGE_KEY, JSON.stringify(merged))
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
        logUser: (context) => {
          if (import.meta.env.DEV) return
          const token = context.githubUser?.token
          if (token) {
            fetch("/api/log-user", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {})
          }
        },
      },
    },
  )
}

/** Get cached markdown files from local storage */
function getMarkdownFilesFromLocalStorage() {
  const markdownFiles = JSON.parse(localStorage.getItem(MARKDOWN_FILES_STORAGE_KEY) ?? "null")
  if (!markdownFiles) return null
  const parsedMarkdownFiles = z.record(z.string(), z.string()).safeParse(markdownFiles)
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
// Config
// -----------------------------------------------------------------------------

/** Get cached config from localStorage */
function getConfigFromLocalStorage(): Config {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      return parseConfigFromJson(stored)
    }
  } catch {
    // Ignore errors
  }
  return DEFAULT_CONFIG
}

/** Save config to localStorage */
function setConfigToLocalStorage(config: Config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, serializeConfig(config))
}

/** Primitive atom to hold the config state */
const configPrimitiveAtom = atom<Config>(getConfigFromLocalStorage())

/** Read-only atom for consuming the config */
export const configAtom = atom((get) => get(configPrimitiveAtom))

/** Writable atom for updating the config */
export const setConfigAtom = atom(null, (get, set, config: Config) => {
  set(configPrimitiveAtom, config)
  setConfigToLocalStorage(config)
})

/** Helper atom for the calendar notes directory (normalized) */
export const calendarNotesDirAtom = atom((get) => {
  const config = get(configAtom)
  return normalizeDirectoryPath(config.calendarNotesDir)
})

/** Function to read config from filesystem and update the atom */
export async function loadConfigFromFs(): Promise<Config> {
  try {
    const configPath = `${REPO_DIR}/${CONFIG_FILE_PATH}`
    const content = await fs.promises.readFile(configPath, "utf8")
    // fs.promises.readFile can return string or Uint8Array
    const contentStr = typeof content === "string" ? content : new TextDecoder().decode(content)
    return parseConfigFromJson(contentStr)
  } catch {
    // Config file doesn't exist, return default
    return DEFAULT_CONFIG
  }
}

/** Atom to trigger config loading from filesystem */
export const loadConfigAtom = atom(null, async (get, set) => {
  const config = await loadConfigFromFs()
  set(configPrimitiveAtom, config)
  setConfigToLocalStorage(config)
})

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
  const config = get(configAtom)
  const calendarNotesDir = normalizeDirectoryPath(config.calendarNotesDir)
  const notes: Map<NoteId, Note> = new Map()

  // Parse notes
  for (const filepath in markdownFiles) {
    // Note ID is just the filepath without .md extension
    const id = filepath.replace(/\.md$/, "")
    const content = markdownFiles[filepath]
    notes.set(id, parseNote(id, content, calendarNotesDir))
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

export const backlinksIndexAtom = atom((get) => {
  const notes = get(notesAtom)
  const index: Map<NoteId, NoteId[]> = new Map()

  for (const note of notes.values()) {
    if (note.links.length === 0) continue
    const uniqueTargets = new Set(note.links)
    for (const targetId of uniqueTargets) {
      if (targetId === note.id) continue
      const backlinks = index.get(targetId)
      if (backlinks) {
        backlinks.push(note.id)
      } else {
        index.set(targetId, [note.id])
      }
    }
  }

  return index
})

export const sortedNotesAtom = atom((get) => {
  const notes = get(notesAtom)

  // Sort notes by updatedAt in descending order (most recent first)
  return [...notes.values()].sort((a, b) => {
    // Pinned notes first
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1

    // Then by updatedAt descending (most recent first)
    // Notes without updatedAt (null) sort to bottom
    if (a.updatedAt !== null && b.updatedAt !== null) {
      if (a.updatedAt !== b.updatedAt) {
        return b.updatedAt - a.updatedAt
      }
    } else if (a.updatedAt !== null) {
      return -1 // a has timestamp, b doesn't -> a first
    } else if (b.updatedAt !== null) {
      return 1 // b has timestamp, a doesn't -> b first
    }

    // Fallback: favor numeric IDs (like timestamps) over non-numeric
    const aNumeric = /^\d+$/.test(a.id)
    const bNumeric = /^\d+$/.test(b.id)
    if (aNumeric && !bNumeric) return -1
    if (!aNumeric && bNumeric) return 1

    return b.id.localeCompare(a.id)
  })
})

export const pinnedNotesAtom = atom((get) => {
  const sortedNotes = get(sortedNotesAtom)
  return sortedNotes.filter((note) => note.pinned)
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
// Tasks
// -----------------------------------------------------------------------------

export const tasksAtom = atom((get) => {
  const notes = get(notesAtom)
  return [...notes.values()].flatMap((note) => note.tasks.map((task) => ({ ...task, note })))
})

export const taskSearcherAtom = atom((get) => {
  const tasks = get(tasksAtom)
  return new Searcher(tasks, {
    keySelector: (task) => [task.text, task.note.title, task.note.displayName],
    threshold: 0.8,
  })
})

// -----------------------------------------------------------------------------
// UI state
// -----------------------------------------------------------------------------

export const epaperAtom = atomWithStorage<boolean>("epaper", false)

export const vimModeAtom = atomWithStorage<boolean>("vim-mode", false)

export const defaultFontAtom = atomWithStorage<Font>("font", "sans")

export const sidebarAtom = atomWithStorage<"expanded" | "collapsed">("sidebar", "expanded")

export const calendarLayoutAtom = atomWithStorage<"week" | "month">("calendar-layout", "week")

// -----------------------------------------------------------------------------
// AI
// -----------------------------------------------------------------------------

export const OPENAI_KEY_STORAGE_KEY = "openai_key"

export const openaiKeyAtom = atomWithStorage<string>(OPENAI_KEY_STORAGE_KEY, "")

export const hasOpenAIKeyAtom = selectAtom(openaiKeyAtom, (key) => key !== "")

export const voiceAssistantEnabledAtom = atomWithStorage<boolean>("voice_assistant_enabled", false)
