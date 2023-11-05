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
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6AlgHb4Au+O+AXkVAOKkASArhgKqxgBOAxBGoWAKEAbmgDWg1JhxDS5FFRr0SzNh04IiogMZYy-ANoAGALrGTiUAAc0sOf0sgAHogCMANlxGAzACYAHACs7q7+ACwA7IH+-gEANCAAnoi+rgCcuGH+If6uYWlGRq7BEQC+pQlS2HhEchTUhHSMLOxc3FycaJy4Vih6AGZdALa4VTK1ZPVKzWpcmiJouvqE5uaONnbLji4IALS+fri+7tHe3mlh+d7uae4JyQjegb64Nye37iFpvr5pZRUgMZ4OxQAQQADyTBI3AAygBJWgAOQA+nDEWskCANvZCNtEPt-Ed3BEIukQoFAmlAkYwvdEJFvLhooV3OEaa5ru5ypV0NVcCCwXDCLCESjwawACoY6y2HF4va+SleNLnCLZXwkv50hAhRmpQIRM7pMIa9LcwG8mQCyBC2STBQNJoqFgAJTANl4-EEWnEkktwPwoJthDt8kUjWUqjdNnmOj0+EMpmlWNlW0xO0+jKe3n8PgivkK1LuSUQJVwF3c1wurgiRhiYXNQP5gcFIYmYcdkdd7rQ7U4nW6vQGw1G-ubQYgtvbUwjM2jaFji3jibMpnWqYTuPTiG8hS8fl8WUNNYp-m1tc8KpVBtcoSMaSCjbH1snIbAQysJESsIAogAZH8AGEJWRF0fwABXBZNsTTUAdkCHMmXcMJiUNSlvCybUYiMTJSXcAJghKe8n2kAMJ1tbR0GIRp509AQhFECRR1I8dW1wSj+BoedFyWTdVjXTEYM3eU0lcF5D1yGIxLCQI8m8c9olwDwIkrSk0hVfw1RIvkXwoqiuJ7PsBx6PoSEGTgRibXSQw46ioG4n1eJXaCNwcbcEFvMIcNzVJvFcIxSRJCIsM03BDRiC4wlCLIc20q0W2DflEkIbQaDowRYBIPQ-RY6ykpSmgXM2YT3P8yJcGuQIGWuM4TmCksPKMAsKpUyLFVCFTfDisi2NgZLUsaHomBQBRGnShjfWYnSEtffKBqgIaRpoHjlxWJMBJlYq3LgxA2SZPzPi8vwCkNbUxLyTIzkuSsAmKDxutYxK+oKwarGG0aoCMroTOHCypvi8iQ2e+bFo+lbln4ixBNcrcdsa84wqMSsTU1GJkLOnNGS8g0YlJW9DwevLgZoIbYAACzSjpvqHMyRysmbbWJ16mHJ5bHNWyH1y22HnDcPwInLWJbhq4lYmLB4OS8o4jGeb4AhJM0AXpwHcHQLAIBoAAxfAUDgcafSY5W2LVjXGm13XYHBvj1qhza5VKw9PBrHMTo5Jr5Ia6JAkyC5axrX4Im+QJCYZkMTa1nW9apwdTPMyzn1D1W0HViOLat5yNpTbn5VvKIlP8DCC0C7wIkibUbkJE08n83MQh8EOVfwCBdd-ADgNAiCoMzoTtt5jynm91ICw5NG-Jpc9ELk0JkNyStYqVhPG+bsBYQATURQCivtuG8mCH35Z+YJjhk8vc3LPy1XOJrDTrcoAUINAIDgRwgS57e+92XcBfvVV1U1eqJZ+UFiEdwRQbihFksHBeLFpwOmmM6WYnA36wQ-oqb2GEsg0nwn4SksRtQ-AyP4dSeRyTFCqghBuYJIQkGQSVOG+w6zlgIdcIKxCYjahkp4Os+FigyyKP5Lk0DpqA1ob3HYioXg+B+EeC+FISQcLVEpfMBRNKhCIaEShiVYHhidFGHsoieY7AwjhPyBoqpXyimqbUhFXjKN3D4P40jNGzXfJ+B4dsUFGKyEcWIioHx+3vMEEKOFIjFFuFSKKPxXDOL0pxGi+jobZ3cuEVwl0pKqQKBhQIWEwiMj+B4JGKE-CfDSDEoG-UaAGPlMEMIiMB5IzOPeFSZ06yElCMY-IgdcnPDKXNEmb0lqNCqe5EILxaz1Lnk08WbgTyvALiaSshRjjBF6UzBab1WZDMSe-HYZVPB+CCMcEkFIULTI8mouZGD-JVV+NEoRANjbJ1NlAc2z9tmeLcFgzIYCS4HGiDEbJnsiG4FzFkUBxIAqBzuTyXKicm662GTvG8SEAo+FyMcbh5cigVWFlVKRIQVK9OjoivuxRWQgqakEN4BZDy0gaipTwGpDS1k0oXW+d8gA */
      id: "global",
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {} as {
        context: Context
        events: Event
        services: {
          initGitHubUser: { data: { githubUser: GitHubUser } }
          initGitHubRepo: { data: { githubRepo: GitHubRepository } }
          cloneRepo: { data: { githubRepo: GitHubRepository } }
          pullFromGitHub: { data: void }
          pushToGitHub: { data: void }
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
                src: "cloneRepo",
                onDone: "loadingFiles",
                onError: {
                  target: "error",
                  actions: "setError",
                },
              },
            },
            syncing: {
              initial: "pulling",
              states: {
                pulling: {
                  invoke: {
                    src: "pullFromGitHub",
                    onDone: "pushing",
                    onError: {
                      target: "#global.signedIn.error",
                      actions: assign({
                        error: (_, event) => event.data as Error,
                      }),
                    },
                  },
                },
                pushing: {
                  type: "final",
                  invoke: {
                    src: "pushToGitHub",
                    onError: {
                      target: "#global.signedIn.error",
                      actions: assign({
                        error: (_, event) => event.data as Error,
                      }),
                    },
                  },
                },
              },
              onDone: "loadingFiles",
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
                onDone: [
                  {
                    cond: "isOnline",
                    target: "syncing",
                  },
                  {
                    target: "idle",
                  },
                ],
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
        cloneRepo: async (context, event) => {
          if (!context.githubUser) throw new Error("Not signed in")

          const githubRepo = event.githubRepo
          const url = `https://github.com/${githubRepo.owner}/${githubRepo.name}`
          const { username, token } = context.githubUser

          // Wipe file system
          // TODO: Only remove the repo directory instead of wiping the entire file system
          // Blocked by https://github.com/isomorphic-git/lightning-fs/issues/71
          fsWipe()

          // Clone repo
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
        pullFromGitHub: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")
          const { username, token } = context.githubUser

          console.log(`$ git pull`)
          await git.pull({
            fs,
            http,
            dir: ROOT_DIR,
            corsProxy: "https://cors.isomorphic-git.org",
            singleBranch: true,
            author: {
              // TODO: Don't hardcode these values
              name: "Cole Bemis",
              email: "colebemis@github.com",
            },
            onMessage: console.log,
            onAuth: () => ({ username, password: token }),
          })
        },
        pushToGitHub: async (context) => {
          if (!context.githubUser) throw new Error("Not signed in")
          const { username, token } = context.githubUser

          console.log(`$ git push`)
          await git.push({
            fs,
            http,
            dir: ROOT_DIR,
            corsProxy: "https://cors.isomorphic-git.org",
            onAuth: () => ({ username, password: token }),
          })
        },
        loadFiles: async () => {
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

          return { markdownFiles: Object.fromEntries(markdownFiles) }
        },
        writeFile: async (_, event) => {
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
