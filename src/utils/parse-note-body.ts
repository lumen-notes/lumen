import { fromMarkdown } from "mdast-util-from-markdown"
import { visit } from "unist-util-visit"
import { tagLink, tagLinkFromMarkdown } from "../remark-plugins/tag-link"
import { dateLink, dateLinkFromMarkdown } from "../remark-plugins/date-link"
import { noteLink, noteLinkFromMarkdown } from "../remark-plugins/note-link"
import { NoteId } from "../types"

/** Extracts metadata from a note body */
export function parseNoteBody(body: string) {
  const noteLinks: NoteId[] = []
  const tagLinks: string[] = []
  const dateLinks: string[] = []

  const mdast = fromMarkdown(body, {
    extensions: [noteLink(), tagLink(), dateLink()],
    mdastExtensions: [noteLinkFromMarkdown(), tagLinkFromMarkdown(), dateLinkFromMarkdown()],
  })

  visit(mdast, (node) => {
    switch (node.type) {
      case "noteLink": {
        noteLinks.push(node.data.id.toString())
        break
      }
      case "tagLink": {
        tagLinks.push(node.data.name)
        break
      }
      case "dateLink": {
        dateLinks.push(node.data.date)
        break
      }
    }
  })

  return { noteLinks, tagLinks, dateLinks }
}
