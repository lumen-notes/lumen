import { describe, expect, it } from "vitest"
import { updateWikilinks } from "./update-wikilinks"

describe("updateWikilinks", () => {
  it("replaces basic wikilinks", () => {
    const input = "Link to [[old-id]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe("Link to [[new-id]]")
  })

  it("replaces wikilinks with labels", () => {
    const input = "See [[old-id|My Note]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe("See [[new-id|My Note]]")
  })

  it("replaces embeds", () => {
    const input = "Embed ![[old-id]] and ![[old-id|Title]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe("Embed ![[new-id]] and ![[new-id|Title]]")
  })

  it("replaces multiple occurrences", () => {
    const input = "[[old-id]] and [[old-id|Alias]] and ![[old-id]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe("[[new-id]] and [[new-id|Alias]] and ![[new-id]]")
  })

  it("only updates the matching id when multiple ids exist", () => {
    const input = "[[old-id]] [[another-id]] [[old-id|Alias]] ![[third-id]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe("[[new-id]] [[another-id]] [[new-id|Alias]] ![[third-id]]")
  })

  it("does not touch other ids", () => {
    const input = "[[other-id]] and [[old-id-2]]"
    const output = updateWikilinks({ fileContent: input, oldId: "old-id", newId: "new-id" })
    expect(output).toBe(input)
  })
})
