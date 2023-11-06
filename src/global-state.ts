import { Searcher } from "fast-fuzzy"
import git, { WORKDIR } from "isomorphic-git"
import http from "isomorphic-git/http/web"
import { atom } from "jotai"
import { atomWithMachine } from "jotai-xstate"
import { atomWithStorage, selectAtom } from "jotai/utils"
import { assign, createMachine } from "xstate"
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

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6AlgHb4Au+O+AXkVAOKkASArhgKqxgBOAxBGoWAKEAbmgDWg1JhxDS5FFRr0SzNh04IiogMZYy-ANoAGALrGTiUAAc0sOf0sgAHogBMANgAsuAMwBGVwBWP0DXAA4wvwB2aKiAGhAAT0RI3ECjDKMY93cwo3SATgBfIoSpbDwiOQpqQjpGFnYubi5ONE5cKxQ9ADN2gFtccpkqshqlBrUuTRE0XX1Cc3NHGzsFxxcEUITkhD8fKLDfTwKjT1dXT3c-T3ySsvQK3DsoAQgAeSYSbgBlAElaAA5AD6f0ByyQIFW9kIG0Q0X8uEirh8nhOuUCYU88SSiCi4SRYVcRhRxL87iMYR89xAwzwLzef0IvwBIPerAAKhDrLYYXC9lFEcjUeiwpjsTt4UY-EdpT4CvssmFBTkaXTnvhXpAmbIxgpavUVCwAEpgGy8fiCLTiSSPGQM7WEXXyRR1ZSqU02GY6PT4QymblQ3nrSGbHyuPy4AqBfzy6Xky6SvaXQK+aNhAr4hUy9xqu30zWMp2jF0G90ms1oFqcNodLq9AZDfMarUQHUl8ZuyaetDeua+-1mUwrYN+2GhxDhyPR2OnPwJzxJzFRJFXHxYlEFKdRPPSAutnVgfpWEiJX4AUQAMueAMIc4HG88ABXegehIdAm3cgW8M6M7hiW4-FOAolzCdxjncA5vy3IDilKWlmwdNsnW0dBiDqHsLQEIRRAkJs9xbItcDQ-gaB7Pt5jHJZh0hd8x35Px8lcXAohOSJcgVSkQiTb8jlOdxwlRddMxjXcnmQnVSIwqAsNadpOm6Eg+k4QZ1Uk1D0PIytKIHRYA1onk1gYic9mY1j2PJDMmMiQIl2-KMY32LEsRJO4EPUwtHWeRJCG0GhsKtWZ8M8g8nVgXz-LqXSFhoiw6NHBxTKY0ILIKDjrO4uzcTMwJUwVWCsXXVwCmxcT7S8lCfL8gL5LrJSVLUpDKp1CKaui60qMHN9EvHT8pVStj0qsrjbKTecjB8XBPGAnxQjy-xpXK-diPQLAIBoAAxfAUDgQLcJtAiJJap01o2uptt22AYuogz4qMvlkvMoaMtGnictOKb3AKVw2IOSb-ExZaiO8s6tp2va6sUhtVKOiqwtwMGLoh67Or0uKR2MpL+r2TxUVwCkfoVQIokCaNPDCJMFSmy5ftOfIM1E4GNNwAB3Tg5GR3b9utELmoR9nOagS6wBu7rDKDLG+ucRAAKMAmjFgnIciJUCcpiGnyUV65w2+wJcw8-niMFsgubAata2h5TG1C42OdN4WIbF-Sh3uyXHpxlKWJekabPe3Yon-ab-1+klyRyfZmZOggIG5n4r1ve9HxfHqpf5b9fxjf9AOlEDeJ8CCsSgw4chK37XCjhH8Fj82fgATUBG9U49mWEAzxyfGzm5c8V8b-wKAnvp8TumO-EvK+I6vuYAdWNP4OXPYFNr+a9m4-Vv27-ADu+A3v1YpVjyVm8ComjAISgQwg0AgOBHDpTGW82ABadwkxf4GO31CYjSmTgH-XzY5wqZTUzGPGMeR1xQU8BPSAnwSD-xMp7dKLFbhk3YhkckJM+55SjNvDI0Zfpongg8QiGkEHY1bicJM2IjieCcsVUI-4C4wKqp-V0hoPSVnIdLTYmYlxRBXGTYuXtvyXBYYeY8p5uH8lCN4ZU7FTiYnSmrXYmJC5riiDBVEudxGaTIphLhCU06mSpCxfwlw5T7GHhKHK+sB6aM7icMOAEFS6OqlFKA0iTGBzSIJYexJFb-n2H3Ohg9YLyjJGKA2JDjoIyRo7K6XjPaXCOD+HI5wgkJhUYgbM00h55BmkEZRbiTbg12kk1uG5CQZC8BcAoFISpJkDt4KC4R8iKxuIcNxU8wAVM2DGfKWdBQlwKFuXi6RVxQW-PgkkgQ3F1T6fCCkK4SoAWuIcecP0mnhmmkSU+s0fwXD8BfIoQA */
      id: "global",
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {} as {
        context: Context
        events: Event
        services: {
          initGitHubUser: { data: { githubUser: GitHubUser } }
          initGitHubRepo: { data: { githubRepo: GitHubRepository } }
          clone: { data: { githubRepo: GitHubRepository } }
          pull: { data: void }
          push: { data: void }
          loadFiles: { data: { markdownFiles: Record<string, string> } }
          writeFile: { data: void }
        }
      },
      predictableActionArguments: true,
      initial: "initializingGitHubUser",
      context: {
        githubUser: null,
        githubRepo: null,
        markdownFiles: {},
        error: null,
      },
      states: {
        initializingGitHubUser: {
          invoke: {
            src: "initGitHubUser",
            onDone: {
              target: "signedIn",
              actions: "setGitHubUser",
            },
            onError: "signedOut",
          },
        },
        signedOut: {
          on: {
            SIGN_IN: {
              target: "signedIn",
              actions: ["setGitHubUser", "setGitHubUserLocalStorage"],
            },
          },
        },
        signedIn: {
          on: {
            SIGN_OUT: {
              target: "signedOut",
              actions: ["clearGitHubUser", "clearGitHubUserLocalStorage"],
            },
          },
          initial: "initializingGitHubRepo",
          states: {
            initializingGitHubRepo: {
              invoke: {
                src: "initGitHubRepo",
                onDone: {
                  target: "loadingFiles",
                  actions: "setGitHubRepo",
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
                src: "clone",
                onDone: "loadingFiles",
                onError: {
                  target: "error",
                  actions: "setError",
                },
              },
            },
            syncing: {
              invoke: {
                src: "sync",
                onDone: "loadingFiles",
                onError: {
                  target: "error",
                  actions: assign({
                    error: (_, event) => event.data as Error,
                  }),
                },
              },
            },
            loadingFiles: {
              invoke: {
                src: "loadFiles",
                onDone: {
                  target: "idle",
                  actions: "setMarkdownFiles",
                },
                onError: {
                  target: "error",
                  actions: "setError",
                },
              },
            },
            writingFile: {
              invoke: {
                src: "writeFile",
                onDone: "idle",
                onError: {
                  target: "error",
                  actions: "setError",
                },
              },
            },
            idle: {
              on: {
                SELECT_REPO: "cloningRepo",
                SYNC: "syncing",
                WRITE_FILE: {
                  target: "writingFile",
                  actions: "setMarkdownFile",
                },
              },
            },
            error: {},
          },
        },
      },
    },
    {
      guards: {
        isOnline: () => navigator.onLine,
      },
      services: {
        initGitHubUser: async () => {
          // First, check URL for token and username
          const token = new URLSearchParams(window.location.search).get("token")
          const username = new URLSearchParams(window.location.search).get("username")

          if (token && username) {
            // Save token and username to local storage
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

          // Next, check local storage for token and username
          const githubUser = JSON.parse(localStorage.getItem(GITHUB_USER_KEY) ?? "null")
          return { githubUser: githubUserSchema.parse(githubUser) }
        },
        initGitHubRepo: async () => {
          // Check git config for repo name
          const remoteOriginUrl = await git.getConfig({
            fs,
            dir: ROOT_DIR,
            path: "remote.origin.url",
          })

          // Remove https://github.com/ from the beginning of the URL to get the repo name
          const repo = String(remoteOriginUrl).replace(/^https:\/\/github.com\//, "")

          const [owner, name] = repo.split("/")

          return { githubRepo: { owner, name } }
        },
        clone: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")

          const githubRepo = event.githubRepo
          const url = `https://github.com/${githubRepo.owner}/${githubRepo.name}`
          const { username, token } = context.githubUser

          // Wipe file system
          // TODO: Only remove the repo directory instead of wiping the entire file system
          // Blocked by https://github.com/isomorphic-git/lightning-fs/issues/71
          fsWipe()

          // Clone repo
          // This could take a long time if the repo is large
          console.log(`$ git clone ${url}.git ${ROOT_DIR}`)
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

          return { githubRepo }
        },
        sync: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")
          const { username, token } = context.githubUser

          console.log(`$ git pull`)
          await git.pull({
            fs,
            http,
            dir: ROOT_DIR,
            singleBranch: true,
            author: {
              // TODO: Don't hardcode these values
              name: "Cole Bemis",
              email: "colebemis@github.com",
            },
            onMessage: console.log,
            onAuth: () => ({ username, password: token }),
          })

          console.log(`$ git push`)
          await git.push({
            fs,
            http,
            dir: ROOT_DIR,
            onAuth: () => ({ username, password: token }),
          })
        },
        loadFiles: async () => {
          console.time("loadFiles")
          const markdownFiles = await git.walk({
            fs,
            dir: ROOT_DIR,
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
          console.timeEnd("loadFiles")
          return { markdownFiles: Object.fromEntries(markdownFiles) }
        },
        writeFile: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")
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
            author: {
              // TODO: Don't hardcode these values
              name: "Cole Bemis",
              email: "colebemis@github.com",
            },
          })

          // Push if online
          if (navigator.onLine) {
            console.log(`$ git push`)
            await git.push({
              fs,
              http,
              dir: ROOT_DIR,
              onAuth: () => ({ username, password: token }),
            })
          }
        },
      },
      actions: {
        setGitHubUser: assign({
          githubUser: (_, event) => {
            switch (event.type) {
              case "SIGN_IN":
                return event.githubUser
              case "done.invoke.global.initializingGitHubUser:invocation[0]":
                return event.data.githubUser
            }
          },
        }),
        setGitHubUserLocalStorage: (_, event) => {
          console.log("setGitHubUserLocalStorage", event.githubUser)
          localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(event.githubUser))
        },
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
              case "done.invoke.global.signedIn.initializingGitHubRepo:invocation[0]":
                return event.data.githubRepo
            }
          },
        }),
        setMarkdownFiles: assign({
          markdownFiles: (_, event) => event.data.markdownFiles,
        }),
        setMarkdownFile: assign({
          markdownFiles: (context, event) => {
            const { filepath, content } = event
            return { ...context.markdownFiles, [filepath]: content }
          },
        }),
        setError: assign({
          // TODO: Remove `as Error`
          error: (_, event) => event.data as Error,
        }),
      },
    },
  )
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

export const deleteNoteAtom = atom(null, (get, set, id: NoteId) => {
  const rawNotes = get(rawNotesAtom)
  const { [id]: _, ...newRawNotes } = rawNotes
  set(rawNotesAtom, newRawNotes)
})

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
