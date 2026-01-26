import { describe, it, expect } from "vitest"
import {
  getListItemBlock,
  findPreviousListItem,
  findNextListItem,
  canMoveListItemUp,
  canMoveListItemDown,
  moveListItemUp,
  moveListItemDown,
} from "./reorder-list-item"

describe("getListItemBlock", () => {
  it("gets a simple list item block", () => {
    const content = "- Item 1\n- Item 2\n"
    // "- Item 1" starts at 0, ends at 8
    const block = getListItemBlock(content, 0, 8)
    expect(block).toEqual({ start: 0, end: 9, indent: 0 })
  })

  it("includes nested content in the block", () => {
    const content = "- Item 1\n  - Nested\n- Item 2\n"
    const block = getListItemBlock(content, 0, 8)
    expect(block).toEqual({ start: 0, end: 20, indent: 0 })
  })

  it("handles indented list items", () => {
    const content = "- Parent\n  - Child 1\n  - Child 2\n"
    // "  - Child 1" starts at 11 (after "- Parent\n  ")
    const block = getListItemBlock(content, 11, 20)
    expect(block).toEqual({ start: 9, end: 21, indent: 2 })
  })
})

describe("findPreviousListItem", () => {
  it("finds the previous item at the same level", () => {
    const content = "- Item 1\n- Item 2\n"
    const block = { start: 9, end: 18, indent: 0 }
    const prev = findPreviousListItem(content, block)
    expect(prev).toEqual({ start: 0, end: 9, indent: 0 })
  })

  it("returns null for the first item", () => {
    const content = "- Item 1\n- Item 2\n"
    const block = { start: 0, end: 9, indent: 0 }
    const prev = findPreviousListItem(content, block)
    expect(prev).toBeNull()
  })

  it("skips nested items when finding previous", () => {
    const content = "- Item 1\n  - Nested\n- Item 2\n"
    const block = { start: 20, end: 29, indent: 0 }
    const prev = findPreviousListItem(content, block)
    expect(prev).toEqual({ start: 0, end: 20, indent: 0 })
  })

  it("returns null when separated by a paragraph", () => {
    const content = "- Item 1\n\nSome paragraph\n\n- Item 2\n"
    const block = { start: 26, end: 35, indent: 0 }
    const prev = findPreviousListItem(content, block)
    expect(prev).toBeNull()
  })
})

describe("findNextListItem", () => {
  it("finds the next item at the same level", () => {
    const content = "- Item 1\n- Item 2\n"
    const block = { start: 0, end: 9, indent: 0 }
    const next = findNextListItem(content, block)
    expect(next).toEqual({ start: 9, end: 18, indent: 0 })
  })

  it("returns null for the last item", () => {
    const content = "- Item 1\n- Item 2\n"
    const block = { start: 9, end: 18, indent: 0 }
    const next = findNextListItem(content, block)
    expect(next).toBeNull()
  })

  it("returns null when separated by a paragraph", () => {
    const content = "- Item 1\n\nSome paragraph\n\n- Item 2\n"
    const block = { start: 0, end: 9, indent: 0 }
    const next = findNextListItem(content, block)
    expect(next).toBeNull()
  })
})

describe("canMoveListItemUp", () => {
  it("returns true when there is a previous item", () => {
    const content = "- Item 1\n- Item 2\n"
    expect(canMoveListItemUp(content, 9, 17)).toBe(true)
  })

  it("returns false for the first item", () => {
    const content = "- Item 1\n- Item 2\n"
    expect(canMoveListItemUp(content, 0, 8)).toBe(false)
  })
})

describe("canMoveListItemDown", () => {
  it("returns true when there is a next item", () => {
    const content = "- Item 1\n- Item 2\n"
    expect(canMoveListItemDown(content, 0, 8)).toBe(true)
  })

  it("returns false for the last item", () => {
    const content = "- Item 1\n- Item 2\n"
    expect(canMoveListItemDown(content, 9, 17)).toBe(false)
  })
})

describe("moveListItemUp", () => {
  it("swaps two simple items", () => {
    const content = "- Item 1\n- Item 2\n"
    const result = moveListItemUp(content, 9, 17)
    expect(result).toBe("- Item 2\n- Item 1\n")
  })

  it("swaps items with nested content", () => {
    const content = "- Item 1\n  - Nested 1\n- Item 2\n  - Nested 2\n"
    const result = moveListItemUp(content, 22, 30)
    expect(result).toBe("- Item 2\n  - Nested 2\n- Item 1\n  - Nested 1\n")
  })

  it("returns null for the first item", () => {
    const content = "- Item 1\n- Item 2\n"
    const result = moveListItemUp(content, 0, 8)
    expect(result).toBeNull()
  })

  it("returns null when separated by paragraph", () => {
    const content = "- Item 1\n\nParagraph\n\n- Item 2\n"
    const result = moveListItemUp(content, 21, 29)
    expect(result).toBeNull()
  })

  it("handles three items - move middle up", () => {
    const content = "- Item 1\n- Item 2\n- Item 3\n"
    const result = moveListItemUp(content, 9, 17)
    expect(result).toBe("- Item 2\n- Item 1\n- Item 3\n")
  })

  it("handles three items - move last up", () => {
    const content = "- Item 1\n- Item 2\n- Item 3\n"
    const result = moveListItemUp(content, 18, 26)
    expect(result).toBe("- Item 1\n- Item 3\n- Item 2\n")
  })

  it("moves nested items within their parent", () => {
    // "- Parent\n  - Child 1\n  - Child 2\n"
    //  0        9           21          33
    const content = "- Parent\n  - Child 1\n  - Child 2\n"
    // "  - Child 2" starts at offset 21, the "- " is at 23
    const result = moveListItemUp(content, 23, 32)
    expect(result).toBe("- Parent\n  - Child 2\n  - Child 1\n")
  })

  it("does not move nested item above parent", () => {
    const content = "- Parent\n  - Child 1\n  - Child 2\n"
    // "  - Child 1" starts at offset 9, the "- " is at 11
    const result = moveListItemUp(content, 11, 20)
    expect(result).toBeNull()
  })

  it("moves checked and unchecked tasks", () => {
    const content = "- [x] Done\n- [ ] Todo\n"
    const result = moveListItemUp(content, 11, 21)
    expect(result).toBe("- [ ] Todo\n- [x] Done\n")
  })

  it("preserves blank lines between loose list items when moving up", () => {
    const content = "- Item 1\n\n- Item 2\n"
    const result = moveListItemUp(content, 10, 18)
    expect(result).toBe("- Item 2\n\n- Item 1\n")
  })

  it("moves items with + list markers", () => {
    const content = "+ Item 1\n+ Item 2\n"
    const result = moveListItemUp(content, 9, 17)
    expect(result).toBe("+ Item 2\n+ Item 1\n")
  })
})

describe("moveListItemDown", () => {
  it("swaps two simple items", () => {
    const content = "- Item 1\n- Item 2\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("- Item 2\n- Item 1\n")
  })

  it("swaps items with nested content", () => {
    const content = "- Item 1\n  - Nested 1\n- Item 2\n  - Nested 2\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("- Item 2\n  - Nested 2\n- Item 1\n  - Nested 1\n")
  })

  it("returns null for the last item", () => {
    const content = "- Item 1\n- Item 2\n"
    const result = moveListItemDown(content, 9, 17)
    expect(result).toBeNull()
  })

  it("returns null when separated by paragraph", () => {
    const content = "- Item 1\n\nParagraph\n\n- Item 2\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBeNull()
  })

  it("handles three items - move first down", () => {
    const content = "- Item 1\n- Item 2\n- Item 3\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("- Item 2\n- Item 1\n- Item 3\n")
  })

  it("handles three items - move middle down", () => {
    const content = "- Item 1\n- Item 2\n- Item 3\n"
    const result = moveListItemDown(content, 9, 17)
    expect(result).toBe("- Item 1\n- Item 3\n- Item 2\n")
  })

  it("moves task items correctly", () => {
    const content = "- [ ] Task 1\n- [ ] Task 2\n"
    const result = moveListItemDown(content, 0, 12)
    expect(result).toBe("- [ ] Task 2\n- [ ] Task 1\n")
  })

  it("moves items with * list markers", () => {
    const content = "* Item 1\n* Item 2\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("* Item 2\n* Item 1\n")
  })

  it("moves ordered list items", () => {
    const content = "1. Item 1\n2. Item 2\n"
    const result = moveListItemDown(content, 0, 9)
    expect(result).toBe("2. Item 2\n1. Item 1\n")
  })

  it("preserves blank lines between loose list items when moving down", () => {
    const content = "- Item 1\n\n- Item 2\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("- Item 2\n\n- Item 1\n")
  })

  it("preserves empty lines and trailing content after moving", () => {
    // Before: bar, blah, fooobar, then empty line, then "hi there"
    const content = "- [ ] bar\n- [ ] blah\n- [ ] fooobar\n\nhi there\n"
    // Move blah (offset 10-20) down past fooobar
    const result = moveListItemDown(content, 10, 20)
    // Expected: bar, fooobar, blah, empty line, hi there
    expect(result).toBe("- [ ] bar\n- [ ] fooobar\n- [ ] blah\n\nhi there\n")
  })

  it("does not include trailing empty lines in item block", () => {
    const content = "- Item 1\n- Item 2\n\nParagraph\n"
    const result = moveListItemDown(content, 0, 8)
    expect(result).toBe("- Item 2\n- Item 1\n\nParagraph\n")
  })
})
