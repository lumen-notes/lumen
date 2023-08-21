import { Note, NoteId } from "../types"

export async function exportAsGist({
  githubToken,
  noteId,
  note,
}: {
  githubToken: string
  noteId: NoteId
  note: Note
}) {
  const filename = `${noteId}.md`

  const timestamp = new Date().toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  })

  const description = `${
    note.title ? `${note.title} · ` : ""
  }Exported from Lumen (https://uselumen.com) on ${timestamp}`

  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
    },
    body: JSON.stringify({
      description,
      public: false,
      files: {
        [filename]: {
          content: note.rawBody,
        },
      },
    }),
  })

  if (!response.ok) {
    console.error(`Failed to export as gist: ${response.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as any

  return data.html_url
}
