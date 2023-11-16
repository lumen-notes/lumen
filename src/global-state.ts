import { Searcher } from "fast-fuzzy"
import git, { WORKDIR } from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { atom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { assign, createMachine } from "xstate"
import { z } from "zod"
import {
  GitHubRepository,
  GitHubUser,
  Note,
  NoteId,
  Task,
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

const ROOT_DIR = "/root"
const DEFAULT_BRANCH = "main"
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
  | { type: "WRITE_FILE"; filepath: string; content: string }
  | { type: "DELETE_FILE"; filepath: string }

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6ATnGigG4CWAdlAKqxj4DEEaFYulJaA1m6pjgSKlKNOvgQc0AYywAXMiwDaABgC6K1YlAAHNLDLyWWkAA9EAFgDsuABwBmS8qcBWSwEZnygGxu3AGhAAT0QAJhDzXEsvAE5lSxtY6OdfEJsAXzSAvmw8QlhicipaegZ6fDR8XG0UOQAzCoBbXGyBPIKRYvFJGUMKDQ1jXX1e4zMEO1TI6K9PKJC7ewcA4IQ3ZWjbR3No+3MFmxsvcwys9BzcfShWCAB5AFdZBgBlAEkAcQA5AH0Xj4GkEBDAwKCijRBHZy4Nw2SyxGzhZz2BLLULJSIhVyHZLKBKIuwnEAtPCXa4vCjPd7fG7UAAq-x0emBRgBY2c2yhB1ibmm8WcIRR4xiUK88PM5l85i8ljs0QJRIuZCukDJgnywioACUwLomCw2JIeM0zgIScqKKr2prtWgJBROD0Qf01INGSMWYgALRuOy4bbOZxeLzhSwhNzmGz+IKIRbC1LS5LRaLxEJy43ExWk81tdVQLU6soVKo1WT1fBNeWmiAq7OFXPW232uSOtT0wGukFghAhWK4NkhKU2Zx2OIwtxeAWIkK+9wzZQTNzuGGp-jppVV81gBraWSBZ4AUQAMnuAMI0r4avcABRuraBbtArPstm5M3czmi23cApiPuiMocHhjpKkrLuclYqlI6AUCIeZoLqrDsHa3C8GmCprhBUEwfW3RNkoLbOgCd4du6CCWO+uCBpKIb+kG3bmAKSSQp4dh2IGIZkTyoEmhmZq4JBLBYfm+DlJU1R1I0RormhmZ8ZhVq6A20i4X0+GaIR7bMg+iBRF4uBzq4Y6uMo8zdt+Up6Y4niJlYc7Qlxq4yfx1z7kep7nleN4EQywzEVpCCYlCITKOKXh2NsOzOAKazDlCH7ejiEwjl49nSbxTmQHxAAWWBUPqEAoGADAAOoai8NJ7l8ABiLxHreGmgiR3I2FCAbhDsCTKB40RRckU7QjY4qxDiC5HCl4HmulEBZTlMDsPlhUACKHnu5VVTVe51T5mmmIgPbSnsZGdUFOJflGqyIs14T2NCTjbOExyZISqHjbJepTVI2W5bgADu+DAlQlVkAV8H6khhoVjx66vdc01fb9-1QIDBWKQ6eHqF5bZbQ1fl2GyvZBTCexitCH6RWd3rmMovaHIOY6OMo-qWGNkMYW9sOzfD8gA0DhUFqJxaluWz0sxNUEZR9M1sJzIhI2AKPKU6aneUy2M7eM-qxSEjihQuYWdVF+y2DM2wHLCoZa8z6Gi2zEtw39XOIzzxWlat1W1RjRHbWMA1TkmMr0748IYlFs64KG0xBn+BwLMlj0Q1b0Pi59HP2zLTtLUervrZtKudkczU0a4w4jgu9HkzMzVhUFvKE6FluOWL73J2wEBgAVDuyyDiGcODwsJ5N7Mt23YAdzz8u9IrLpY52HrmJCDM2WOWsJGs3hRe4VPREF3L3TTlgPacUkvQPtuza37dp8DfNFuJZaSWBIuJ03ku4OfI+X3LOET6pU+5yRHrzDDh1EMc9KYRkOOvLwVM2SWFhD4eIIYlxxz7g3G2zdX7D1HsDEqZUKpuw2h7eqnZ5jWETNKBIOwPCHHHOTWE1gYhrDCP2ewiY3D1zSo3QeGCL7c2BhnFaeDs6EOniRLWPpkitU6q4O6NgBRBSOGHF8ZFfB2GhCxdhUMB6wECBQKQc1gZPAAJofGPDne8atxQRAXAzQcW95hslxnI1RERwzxFUTsCuY4NGsxhto3RFwdFSBEF3A0KEj6Py0YEgJuiRDj2bOjJWmM-44wjL6UMrEfAxCCrjSwci+S6RscORKYppHeOtr4qJfiglUFKMJQsYkSwSXjqgip-iqmxK-vEsxvkLEM1wKxQcQYEphisGTFY4RuRAImEU8I-Z+wZEehQNArd4AAiJL-cxYwAEOD0jAzqQZ4jREjCsABFFuyIjIvvEU+SUo1g6GIDZPSxhhX6ekiMWsoFiKSAKAamxgpuFmUOMM+8NH3FkI8r2iAhwbDnguRwExRlBgYhEMIMwgwyi3ouA+T1wlWwharLZJNdmLwOSvAU2wIhJkMnOUMi4mbINxTJO58k0D4pnqGKEhloVhgitKCcg58YHIXIBeY2Lmm8U3NuFYytNngjDJEYyVgAUcVYnYb86w9JzL2BTcKYqUEcIEiytlJEAyQjCvEI4iZ7CwlkWdGwGq5zwjmO4cwYQ9WMoNdcY1fkvTimJY4JehzjmIF8DMam1y6YuFcGUp+g9vVqw9H+f1+zl5HKihiH0OII1SijfSw+D9+6cNPnlAq8axib28G1ZIjhQxWAOD1BciieQeFgVvOIMaT7oOlrwsAZaoUin6T4aENEqGuqitsNw+MFyeHFKxWUDKC0tKTi-N+WDe3qREX5CtQY-TWNrfEW1Kx+qQnDlKFtZt20Lu4oWtmVS+2rAmFCHEVgM2JliHsORoYqb7wWHOHdCQUxXocp6jKVT9HrplU8kN9qn0DWohi99aqzomUnT+qUEijmYo7ZwsD7SqD3qgVTdDSQ5xb0AmXcZ3ZLp7ClNsWceIFlpCAA */
      id: "global",
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {} as {
        context: Context
        events: Event
        services: {
          resolveUser: {
            data: {
              githubUser: GitHubUser
            }
          }
          resolveRepo: {
            data: {
              githubRepo: GitHubRepository
              markdownFiles: Record<string, string>
            }
          }
          cloneRepo: {
            data: {
              markdownFiles: Record<string, string>
            }
          }
          sync: {
            data: {
              markdownFiles: Record<string, string>
            }
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
                onError: {
                  target: "empty",
                  actions: "setError",
                },
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
                        onDone: "idle",
                        onError: {
                          target: "idle",
                          actions: "setError",
                        },
                      },
                      on: {
                        WRITE_FILE: "writingFile",
                        DELETE_FILE: "deletingFile",
                      },
                    },
                    deletingFile: {
                      entry: ["deleteMarkdownFile", "deleteMarkdownFileLocalStorage"],
                      invoke: {
                        src: "deleteFile",
                        onDone: "idle",
                        onError: {
                          target: "idle",
                          actions: "setError",
                        },
                      },
                      on: {
                        WRITE_FILE: "writingFile",
                        DELETE_FILE: "deletingFile",
                      },
                    },
                  },
                },
                sync: {
                  initial: "syncing",
                  states: {
                    idle: {
                      on: {
                        SYNC: "syncing",
                      },
                    },
                    syncing: {
                      invoke: {
                        src: "sync",
                        onDone: {
                          target: "idle",
                          actions: ["setMarkdownFiles", "setMarkdownFilesLocalStorage"],
                        },
                        onError: {
                          target: "idle",
                          actions: "setError",
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
    },
    {
      services: {
        resolveUser: async () => {
          // First, check URL params for token and username
          const token = new URLSearchParams(window.location.search).get("token")
          const username = new URLSearchParams(window.location.search).get("username")

          if (token && username) {
            // Save token and username to localStorage
            localStorage.setItem(GITHUB_USER_KEY, JSON.stringify({ token, username }))

            // Remove token and username from URL
            const searchParams = new URLSearchParams(window.location.search)
            searchParams.delete("token")
            searchParams.delete("username")
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}${
                searchParams.toString() ? `?${searchParams.toString()}` : ""
              }`,
            )

            return { githubUser: { token, username } }
          }

          // Next, check localStorage for token and username
          const githubUser = JSON.parse(localStorage.getItem(GITHUB_USER_KEY) ?? "null")
          return { githubUser: githubUserSchema.parse(githubUser) }
        },
        resolveRepo: async () => {
          console.time("resolveRepo()")

          // Check git config for repo name
          const remoteOriginUrl = await git.getConfig({
            fs,
            dir: ROOT_DIR,
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
            getMarkdownFilesFromLocalStorage() ?? (await getMarkdownFilesFromFs(ROOT_DIR))

          console.timeEnd("resolveRepo()")

          return { githubRepo, markdownFiles }
        },
        cloneRepo: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const githubRepo = event.githubRepo
          const url = `https://github.com/${githubRepo.owner}/${githubRepo.name}`
          const { username, token } = context.githubUser

          // Wipe file system
          // TODO: Only remove the repo directory instead of wiping the entire file system
          // Blocked by https://github.com/isomorphic-git/lightning-fs/issues/71
          fsWipe()

          // Clone repo
          // This could take awhile if the repo is large
          console.time(`$ git clone ${url}.git ${ROOT_DIR}`)
          await git.clone({
            fs,
            http,
            dir: ROOT_DIR,
            corsProxy: "https://cors.isomorphic-git.org",
            url,
            ref: DEFAULT_BRANCH,
            singleBranch: true,
            depth: 1,
            onMessage: console.log,
            onAuth: () => ({ username, password: token }),
          })
          console.timeEnd(`$ git clone ${url}.git ${ROOT_DIR}`)

          // Set user in git config
          console.log(`$ git config user.name "Cole Bemis"`)
          await git.setConfig({
            fs,
            dir: ROOT_DIR,
            path: "user.name",
            value: "Cole Bemis",
          })

          console.log(`$ git config user.email "colebemis@github.com"`)
          await git.setConfig({
            fs,
            dir: ROOT_DIR,
            path: "user.email",
            value: "colebemis@github.com",
          })

          const markdownFiles = await getMarkdownFilesFromFs(ROOT_DIR)

          return { markdownFiles }
        },
        sync: async (context) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { username, token } = context.githubUser

          console.time(`$ git pull`)
          await git.pull({
            fs,
            http,
            dir: ROOT_DIR,
            singleBranch: true,
            onAuth: () => ({ username, password: token }),
          })
          console.timeEnd(`$ git pull`)

          console.time(`$ git push`)
          await git.push({
            fs,
            http,
            dir: ROOT_DIR,
            onAuth: () => ({ username, password: token }),
          })
          console.timeEnd(`$ git push`)

          const markdownFiles = await getMarkdownFilesFromFs(ROOT_DIR)

          return { markdownFiles }
        },
        writeFile: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { username, token } = context.githubUser
          const { filepath, content } = event

          // Write file to file system
          console.log(`$ echo "${content}" > ${filepath}`)
          await fs.promises.writeFile(`${ROOT_DIR}/${filepath}`, content, "utf8")

          // Stage file
          console.log(`$ git add ${filepath}`)
          await git.add({
            fs,
            dir: ROOT_DIR,
            filepath,
          })

          // Commit file
          console.log(`$ git commit -m "Update ${filepath}"`)
          await git.commit({
            fs,
            dir: ROOT_DIR,
            message: `Update ${filepath}`,
          })

          // Push if online
          if (navigator.onLine) {
            console.time(`$ git push`)
            await git.push({
              fs,
              http,
              dir: ROOT_DIR,
              onAuth: () => ({ username, password: token }),
            })
            console.timeEnd(`$ git push`)
          }
        },
        deleteFile: async (context, event) => {
          if (!context.githubUser) {
            throw new Error("Not signed in")
          }

          const { username, token } = context.githubUser
          const { filepath } = event

          // Delete file from file system
          console.log(`$ rm ${filepath}`)
          await fs.promises.unlink(`${ROOT_DIR}/${filepath}`)

          // Stage deletion
          console.log(`$ git rm ${filepath}`)
          await git.remove({
            fs,
            dir: ROOT_DIR,
            filepath,
          })

          // Commit deletion
          console.log(`$ git commit -m "Delete ${filepath}"`)
          await git.commit({
            fs,
            dir: ROOT_DIR,
            message: `Delete ${filepath}`,
          })

          // Push if online
          if (navigator.onLine) {
            console.time(`$ git push`)
            await git.push({
              fs,
              http,
              dir: ROOT_DIR,
              onAuth: () => ({ username, password: token }),
            })
            console.timeEnd(`$ git push`)
          }
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
    // TODO: Rename rawBody to content
    const rawBody = markdownFiles[filepath]
    notes.set(id, { id, rawBody, ...parseNote(id, rawBody), backlinks: [] })
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
    keySelector: (note) => [note.title, note.rawBody, note.id],
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

  for (const { id, rawBody, frontmatter } of notes.values()) {
    const template = frontmatter["template"]

    // Skip if note isn't a template
    if (!template) continue

    try {
      const parsedTemplate = templateSchema.omit({ body: true }).parse(template)

      const body = removeTemplateFrontmatter(rawBody)

      templates[id] = { ...parsedTemplate, body }
    } catch (error) {
      // Template frontmatter didn't match the schema
      console.error(error)
    }
  }

  return templates
})

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

export const tasksAtom = atom((get) => {
  const sortedNotes = get(sortedNotesAtom)
  const tasks: Task[] = []

  for (const { tasks: notesTasks } of sortedNotes) {
    for (const task of notesTasks) {
      tasks.push(task)
    }
  }

  return tasks
})

export const taskSearcherAtom = atom((get) => {
  const tasks = get(tasksAtom)
  return new Searcher(tasks, {
    keySelector: (task) => [task.title, task.rawBody],
    threshold: 0.8,
  })
})
