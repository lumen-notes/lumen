import type { StoryFn } from "@storybook/react"
import { NotePreview } from "./note-preview"
import { Note } from "../schema"

export default {
  title: "NotePreview",
  component: NotePreview,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story: StoryFn) => (
      <div className="card-1 w-[300px]">
        <Story />
      </div>
    ),
  ],
}

const basicNote: Note = {
  id: "basic-note",
  content: "# Hello World\n\nThis is a simple note with some content.",
  type: "note",
  displayName: "Hello World",
  frontmatter: {},
  title: "Hello World",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: [],
  tasks: [],
  backlinks: [],
}

const noteWithTags: Note = {
  id: "note-with-tags",
  content:
    "---\ntags:\n  - book\n  - fiction\n---\n\n# Reading List\n\nBooks I want to read this year.",
  type: "note",
  displayName: "Reading List",
  frontmatter: { tags: ["book", "fiction"] },
  title: "Reading List",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: ["book", "fiction"],
  tasks: [],
  backlinks: [],
}

const publishedNote: Note = {
  id: "published-note",
  content:
    "---\ntags:\n  - project\n  - web\ngist_id: abc123def456\n---\n\n# My Project\n\nA published note about my project.",
  type: "note",
  displayName: "My Project",
  frontmatter: { tags: ["project", "web"], gist_id: "abc123def456" },
  title: "My Project",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: ["project", "web"],
  tasks: [],
  backlinks: [],
}

const noteWithManyTags: Note = {
  id: "note-with-many-tags",
  content:
    "---\ntags:\n  - book\n  - fiction\n  - fantasy\n  - sci-fi\n  - thriller\n  - mystery\n---\n\n# Genre Collection\n\nA note with many tags.",
  type: "note",
  displayName: "Genre Collection",
  frontmatter: { tags: ["book", "fiction", "fantasy", "sci-fi", "thriller", "mystery"] },
  title: "Genre Collection",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: ["book", "fiction", "fantasy", "sci-fi", "thriller", "mystery"],
  tasks: [],
  backlinks: [],
}

const noteWithBacklinks: Note = {
  id: "note-with-backlinks",
  content: "# Popular Note\n\nThis note is linked to by many other notes.",
  type: "note",
  displayName: "Popular Note",
  frontmatter: {},
  title: "Popular Note",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: [],
  tasks: [],
  backlinks: ["note-1", "note-2", "note-3", "note-4", "note-5", "note-6", "note-7", "note-8"],
}

const noteWithTasks: Note = {
  id: "note-with-tasks",
  content:
    "# Todo List\n\n- [x] First task\n- [x] Second task\n- [ ] Third task\n- [ ] Fourth task\n- [ ] Fifth task",
  type: "note",
  displayName: "Todo List",
  frontmatter: {},
  title: "Todo List",
  url: null,
  alias: null,
  pinned: false,
  updatedAt: null,
  links: [],
  dates: [],
  tags: [],
  tasks: [
    {
      completed: true,
      text: "First task",
      links: [],
      tags: [],
      date: null,
      priority: null,
      startOffset: 0,
    },
    {
      completed: true,
      text: "Second task",
      links: [],
      tags: [],
      date: null,
      priority: null,
      startOffset: 0,
    },
    {
      completed: false,
      text: "Third task",
      links: [],
      tags: [],
      date: null,
      priority: null,
      startOffset: 0,
    },
    {
      completed: false,
      text: "Fourth task",
      links: [],
      tags: [],
      date: null,
      priority: null,
      startOffset: 0,
    },
    {
      completed: false,
      text: "Fifth task",
      links: [],
      tags: [],
      date: null,
      priority: null,
      startOffset: 0,
    },
  ],
  backlinks: [],
}

export const Basic = {
  args: {
    note: basicNote,
  },
}

export const WithTags = {
  args: {
    note: noteWithTags,
  },
}

export const Published = {
  args: {
    note: publishedNote,
  },
}

export const WithManyTags = {
  args: {
    note: noteWithManyTags,
  },
}

export const WithBacklinks = {
  args: {
    note: noteWithBacklinks,
  },
}

export const WithTasks = {
  args: {
    note: noteWithTasks,
  },
}
