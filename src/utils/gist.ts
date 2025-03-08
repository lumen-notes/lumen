import { request } from "@octokit/request"
import { Note } from "../schema"

export async function createGist({ githubToken, note }: { githubToken: string; note: Note }) {
  const filename = `${note.id}.md`

  try {
    const response = await request("POST /gists", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      public: false,
      files: {
        [filename]: {
          content: note.content,
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Failed to create gist:", error)
    return null
  }
}

export async function updateGist({
  githubToken,
  gistId,
  note,
}: {
  githubToken: string
  gistId: string
  note: Note
}) {
  const filename = `${note.id}.md`

  try {
    const response = await request("PATCH /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      gist_id: gistId,
      files: {
        [filename]: {
          content: note.content,
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Failed to update gist:", error)
    return null
  }
}

export async function deleteGist({ githubToken, gistId }: { githubToken: string; gistId: string }) {
  try {
    const response = await request("DELETE /gists/{gist_id}", {
      headers: {
        authorization: `token ${githubToken}`,
      },
      gist_id: gistId,
    })

    return response.status === 204
  } catch (error) {
    console.error("Failed to delete gist:", error)
    return false
  }
}
