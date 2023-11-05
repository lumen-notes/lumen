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

function createGlobalStateMachine() {
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5RQDYHsBGBDFA6AlgHb4Au+O+AXkVAOKkASArhgKqxgBOAxBGoWAKEAbmgDWg1JhxDS5FFRr0SzNh04IiogMZYy-ANoAGALrGTiUAAc0sOf0sgAHogBMANgAsuAMwBGVwBWI08ADndQgE5IkPcAGhAAT0QfAHZA3x9AyM9c1yM-VIKAX2KEqWw8IjkKakI6RhZ2Lm4uTjROXCsUPQAzDoBbXAqZarJapUa1Lk0RNF19QnNzRxs7RccXBA9vfyCQ8KiYz3iktx8fXFdU9yNA91vPa79PQNLy9ErcOygBCABJQjcADK-1oADkAPoAeVYABUVkgQGt7IRNohspFcEZ3EEgoFAq5PKlCglkghQn5cJ5otFQoEfEYSZTIu8QCM8D8-tCmCQQWCof9wYjrLZUeiEJjsbjCQTCcTSWdtkZLjEZYFUj53H4-D5PKUyiBCGgIHBHBzVmKNkitgBaU7k+3Yowu11u12pNkc2TjBR1BoqJrqS3rfAOG2IJ5klLZXwBQJ+W5BRNRL2fGRcyCAkPiiMUhO4dz3VyhTw+faha7R7ZPXD0yJa9I+UKhRtvQ3ezMQHkkHPW0BbE7ebJpIvhPVPVzV1zlq43O45VxEhOuA3FIA */
      id: "global",
      tsTypes: {} as import("./global-state.typegen").Typegen0,
      schema: {} as {
        context: Context
        events: Event
        services: {
          initGitHubUser: { data: { githubUser: GitHubUser } }
          initGitHubRepo: { data: { githubRepo: GitHubRepository } }
          cloneRepo: { data: { githubRepo: GitHubRepository } }
          loadFiles: { data: { markdownFiles: Record<string, string> } }
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
            idle: {
              on: {
                SELECT_REPO: "cloningRepo",
              },
            },
            error: {},
          },
        },
      },
    },
    {
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
          if (!("githubRepo" in event)) {
            throw new Error("No repository selected")
          }

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
        setError: assign({
          // TODO: Remove `as Error`
          error: (_, event) => event.data as Error,
        }),
      },
    },
  )
}

export const globalStateMachineAtom = atomWithMachine(createGlobalStateMachine, {
  devTools: import.meta.env.DEV,
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
// export const githubRepoAtom = atomWithStorage<GitHubRepository | null>("github_repo", null)

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export const rawNotesAtom = atomWithStorage<Record<NoteId, string>>("raw_notes", {})

export const upsertNoteAtom = atom(
  null,
  (get, set, { id, rawBody }: { id: NoteId; rawBody: string }) => {
    const rawNotes = get(rawNotesAtom)
    set(rawNotesAtom, { ...rawNotes, [id]: rawBody })
  },
)

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
