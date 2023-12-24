import { expect, test } from "vitest"
import { updateTagInContent } from "./tags"

type TestCases = Array<{
  input: string
  tagName: string
  operation: "rename" | "delete"
  newName?: string
  output: string
}>

function runTagUpdateTests(tests: TestCases) {
  for (const { input, tagName, operation, newName, output } of tests) {
    test(`${operation} tag '${tagName}'`, () => {
      const result = updateTagInContent(input, tagName, operation, newName)
      expect(result).toBe(output)
    })
  }
}

runTagUpdateTests([
  {
    input: "Content with #oldTag and tags: [oldTag, anotherTag]",
    tagName: "oldTag",
    operation: "rename",
    newName: "newTag",
    output: "Content with #newTag and tags: [newTag, anotherTag]",
  },
  {
    input: "Delete tags: [tagToDelete, keepTag]",
    tagName: "tagToDelete",
    operation: "delete",
    output: "Delete tags: [keepTag]",
  },
  {
    input: "Delete #some",
    tagName: "some",
    operation: "delete",
    output: "Delete ",
  },
  {
    input: "Content #tagInContent tags: [tagInContent, anotherTag]",
    tagName: "tagInContent",
    operation: "delete",
    output: "Content  tags: [anotherTag]",
  },
  {
    input: "Rename #tagToRename tags: [tagToRename, otherTag]",
    tagName: "tagToRename",
    operation: "rename",
    newName: "renamedTag",
    output: "Rename #renamedTag tags: [renamedTag, otherTag]",
  },
  {
    input: "No tags present",
    tagName: "absentTag",
    operation: "delete",
    output: "No tags present",
  },
  {
    input: "Empty tags: []",
    tagName: "irrelevantTag",
    operation: "rename",
    newName: "newName",
    output: "Empty tags: []",
  },
  {
    input: "Single tag: #singleTag",
    tagName: "singleTag",
    operation: "delete",
    output: "Single tag: ",
  },
])
