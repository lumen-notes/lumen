// Utility functions for reordering list items in markdown content

type ListItemBlock = {
  start: number
  end: number
  indent: number
}

const LIST_ITEM_REGEX = /^\s*(?:[-+*]|\d+[.)])\s+/

function isListItemLine(line: string): boolean {
  return LIST_ITEM_REGEX.test(line)
}

/**
 * Gets the full list item block boundaries (including nested content)
 */
export function getListItemBlock(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): ListItemBlock | null {
  if (nodeStartOffset < 0 || nodeEndOffset > content.length) return null

  // Find start of line
  let lineStart = nodeStartOffset
  while (lineStart > 0 && content[lineStart - 1] !== "\n") {
    lineStart--
  }

  // Get indentation
  const indent = nodeStartOffset - lineStart

  // Find end including nested content
  let lineEnd = nodeEndOffset
  if (lineEnd < content.length && content[lineEnd] === "\n") {
    lineEnd++
  }

  // Scan forward for nested content (lines with greater indentation)
  // Only include empty lines if they're followed by nested content
  while (lineEnd < content.length) {
    let nextLineEnd = lineEnd
    while (nextLineEnd < content.length && content[nextLineEnd] !== "\n") {
      nextLineEnd++
    }

    const nextLine = content.slice(lineEnd, nextLineEnd)

    // Empty line - look ahead to see if there's nested content after
    if (nextLine.trim() === "") {
      // Look ahead past empty lines to find next non-empty line
      let lookAhead = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
      while (lookAhead < content.length) {
        let lookAheadEnd = lookAhead
        while (lookAheadEnd < content.length && content[lookAheadEnd] !== "\n") {
          lookAheadEnd++
        }
        const lookAheadLine = content.slice(lookAhead, lookAheadEnd)
        if (lookAheadLine.trim() !== "") {
          // Found non-empty line - check if it's nested
          const lookAheadIndent = lookAheadLine.length - lookAheadLine.trimStart().length
          if (lookAheadIndent > indent) {
            // It's nested content, include the empty line
            lineEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
            break
          } else {
            // Not nested, stop here (don't include empty line)
            return { start: lineStart, end: lineEnd, indent }
          }
        }
        lookAhead = lookAheadEnd < content.length ? lookAheadEnd + 1 : lookAheadEnd
      }
      // If we reach end of content without finding non-empty, stop
      if (lookAhead >= content.length) {
        return { start: lineStart, end: lineEnd, indent }
      }
      continue
    }

    const nextLineIndent = nextLine.length - nextLine.trimStart().length

    // If indentation is greater, it's nested content
    if (nextLineIndent > indent) {
      lineEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
    } else {
      break
    }
  }

  return { start: lineStart, end: lineEnd, indent }
}

/**
 * Finds the previous list item at the same indentation level
 */
export function findPreviousListItem(content: string, block: ListItemBlock): ListItemBlock | null {
  let searchPos = block.start - 1

  // Skip trailing newlines
  while (searchPos >= 0 && content[searchPos] === "\n") {
    searchPos--
  }
  if (searchPos < 0) return null

  // Search backwards for a list item at the same indentation
  while (searchPos >= 0) {
    let lineStartPos = searchPos
    while (lineStartPos > 0 && content[lineStartPos - 1] !== "\n") {
      lineStartPos--
    }

    const line = content.slice(lineStartPos, searchPos + 1)
    const lineIndent = line.length - line.trimStart().length

    // If we hit a non-empty, non-list line at same or lower indentation, list is broken
    if (line.trim() !== "" && !isListItemLine(line) && lineIndent <= block.indent) {
      return null
    }

    // If we hit a list item with lower indentation, we've reached the parent boundary
    if (isListItemLine(line) && lineIndent < block.indent) {
      return null
    }

    // Found a list item at same indentation
    if (lineIndent === block.indent && isListItemLine(line)) {
      // Find end of this item (only include empty lines if followed by nested content)
      let itemEnd = searchPos + 1
      if (itemEnd < content.length && content[itemEnd] === "\n") {
        itemEnd++
      }
      while (itemEnd < block.start) {
        let nextLineEnd = itemEnd
        while (nextLineEnd < content.length && content[nextLineEnd] !== "\n") {
          nextLineEnd++
        }
        const nextLine = content.slice(itemEnd, nextLineEnd)

        // Empty line - look ahead to see if there's nested content after
        if (nextLine.trim() === "") {
          let lookAhead = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
          while (lookAhead < content.length && lookAhead < block.start) {
            let lookAheadEnd = lookAhead
            while (lookAheadEnd < content.length && content[lookAheadEnd] !== "\n") {
              lookAheadEnd++
            }
            const lookAheadLine = content.slice(lookAhead, lookAheadEnd)
            if (lookAheadLine.trim() !== "") {
              const lookAheadIndent = lookAheadLine.length - lookAheadLine.trimStart().length
              if (lookAheadIndent > block.indent) {
                itemEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
                break
              } else {
                return { start: lineStartPos, end: itemEnd, indent: block.indent }
              }
            }
            lookAhead = lookAheadEnd < content.length ? lookAheadEnd + 1 : lookAheadEnd
          }
          if (lookAhead >= content.length || lookAhead >= block.start) {
            return { start: lineStartPos, end: itemEnd, indent: block.indent }
          }
          continue
        }

        const nextLineIndent = nextLine.length - nextLine.trimStart().length
        if (nextLineIndent > block.indent) {
          itemEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
        } else {
          break
        }
      }
      return { start: lineStartPos, end: itemEnd, indent: block.indent }
    }

    searchPos = lineStartPos - 2
  }
  return null
}

/**
 * Finds the next list item at the same indentation level
 */
export function findNextListItem(content: string, block: ListItemBlock): ListItemBlock | null {
  let searchPos = block.end

  while (searchPos < content.length) {
    // Skip to start of next line
    let lineStartPos = searchPos
    while (lineStartPos < content.length && content[lineStartPos] === "\n") {
      lineStartPos++
    }
    if (lineStartPos >= content.length) return null

    // Find end of line
    let lineEndPos = lineStartPos
    while (lineEndPos < content.length && content[lineEndPos] !== "\n") {
      lineEndPos++
    }

    const line = content.slice(lineStartPos, lineEndPos)
    const lineIndent = line.length - line.trimStart().length

    // If we hit a non-empty, non-list line at same or lower indentation, list is broken
    if (line.trim() !== "" && !isListItemLine(line) && lineIndent <= block.indent) {
      return null
    }

    // If we hit a list item with lower indentation, we've reached the parent boundary
    if (isListItemLine(line) && lineIndent < block.indent) {
      return null
    }

    // Found a list item at same indentation
    if (lineIndent === block.indent && isListItemLine(line)) {
      // Find end of this item (only include empty lines if followed by nested content)
      let itemEnd = lineEndPos < content.length ? lineEndPos + 1 : lineEndPos
      while (itemEnd < content.length) {
        let nextLineEnd = itemEnd
        while (nextLineEnd < content.length && content[nextLineEnd] !== "\n") {
          nextLineEnd++
        }
        const nextLine = content.slice(itemEnd, nextLineEnd)

        // Empty line - look ahead to see if there's nested content after
        if (nextLine.trim() === "") {
          let lookAhead = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
          while (lookAhead < content.length) {
            let lookAheadEnd = lookAhead
            while (lookAheadEnd < content.length && content[lookAheadEnd] !== "\n") {
              lookAheadEnd++
            }
            const lookAheadLine = content.slice(lookAhead, lookAheadEnd)
            if (lookAheadLine.trim() !== "") {
              const lookAheadIndent = lookAheadLine.length - lookAheadLine.trimStart().length
              if (lookAheadIndent > block.indent) {
                itemEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
                break
              } else {
                return { start: lineStartPos, end: itemEnd, indent: block.indent }
              }
            }
            lookAhead = lookAheadEnd < content.length ? lookAheadEnd + 1 : lookAheadEnd
          }
          if (lookAhead >= content.length) {
            return { start: lineStartPos, end: itemEnd, indent: block.indent }
          }
          continue
        }

        const nextLineIndent = nextLine.length - nextLine.trimStart().length
        if (nextLineIndent > block.indent) {
          itemEnd = nextLineEnd < content.length ? nextLineEnd + 1 : nextLineEnd
        } else {
          break
        }
      }
      return { start: lineStartPos, end: itemEnd, indent: block.indent }
    }

    searchPos = lineEndPos + 1
  }
  return null
}

/**
 * Finds the first list item at the same indentation level
 */
export function findFirstListItem(content: string, block: ListItemBlock): ListItemBlock | null {
  let firstItem: ListItemBlock | null = null
  let currentBlock = block

  // Keep finding previous items until we can't anymore
  let prevItem = findPreviousListItem(content, currentBlock)
  while (prevItem !== null) {
    firstItem = prevItem
    currentBlock = prevItem
    prevItem = findPreviousListItem(content, currentBlock)
  }

  return firstItem
}

/**
 * Finds the last list item at the same indentation level
 */
export function findLastListItem(content: string, block: ListItemBlock): ListItemBlock | null {
  let lastItem: ListItemBlock | null = null
  let currentBlock = block

  // Keep finding next items until we can't anymore
  let nextItem = findNextListItem(content, currentBlock)
  while (nextItem !== null) {
    lastItem = nextItem
    currentBlock = nextItem
    nextItem = findNextListItem(content, currentBlock)
  }

  return lastItem
}

/**
 * Checks if a list item can be moved to the top (has at least 2 items above)
 */
export function canMoveListItemToTop(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): boolean {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return false
  // Can move to top if there's a previous item (and it's not already at top)
  const prevItem = findPreviousListItem(content, block)
  return prevItem !== null
}

/**
 * Checks if a list item can be moved to the bottom (has at least 2 items below)
 */
export function canMoveListItemToBottom(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): boolean {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return false
  // Can move to bottom if there's a next item (and it's not already at bottom)
  const nextItem = findNextListItem(content, block)
  return nextItem !== null
}

/**
 * Checks if a list item can be moved up
 */
export function canMoveListItemUp(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): boolean {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return false
  return findPreviousListItem(content, block) !== null
}

/**
 * Checks if a list item can be moved down
 */
export function canMoveListItemDown(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): boolean {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return false
  return findNextListItem(content, block) !== null
}

/**
 * Moves a list item up (swap with previous item)
 * Returns the new content, or null if the item can't be moved
 */
export function moveListItemUp(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): string | null {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return null

  const prevItem = findPreviousListItem(content, block)
  if (!prevItem) return null

  const currentContent = content.slice(block.start, block.end)
  const prevContent = content.slice(prevItem.start, prevItem.end)
  const separator = content.slice(prevItem.end, block.start)

  // Handle case where currentContent doesn't end with a newline (last item in file without trailing newline)
  // We need to ensure proper separation after swapping
  let adjustedCurrentContent = currentContent
  let adjustedPrevContent = prevContent

  if (!currentContent.endsWith("\n")) {
    // currentContent was the last item without trailing newline
    // Add newline after it, and remove the trailing newline from prevContent if it has one
    // (so prevContent, which becomes last, preserves the original "no trailing newline" behavior)
    adjustedCurrentContent = currentContent + "\n"
    if (prevContent.endsWith("\n")) {
      adjustedPrevContent = prevContent.slice(0, -1)
    }
  }

  return (
    content.slice(0, prevItem.start) +
    adjustedCurrentContent +
    separator +
    adjustedPrevContent +
    content.slice(block.end)
  )
}

/**
 * Moves a list item down (swap with next item)
 * Returns the new content, or null if the item can't be moved
 */
export function moveListItemDown(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): string | null {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return null

  const nextItem = findNextListItem(content, block)
  if (!nextItem) return null

  const currentContent = content.slice(block.start, block.end)
  const nextContent = content.slice(nextItem.start, nextItem.end)
  const separator = content.slice(block.end, nextItem.start)

  // Handle case where nextContent doesn't end with a newline (last item in file without trailing newline)
  // We need to ensure proper separation after swapping
  let adjustedNextContent = nextContent
  let adjustedCurrentContent = currentContent

  if (!nextContent.endsWith("\n")) {
    // nextContent was the last item without trailing newline
    // Add newline after it, and remove the trailing newline from currentContent if it has one
    // (so currentContent, which becomes last, preserves the original "no trailing newline" behavior)
    adjustedNextContent = nextContent + "\n"
    if (currentContent.endsWith("\n")) {
      adjustedCurrentContent = currentContent.slice(0, -1)
    }
  }

  return (
    content.slice(0, block.start) +
    adjustedNextContent +
    separator +
    adjustedCurrentContent +
    content.slice(nextItem.end)
  )
}

/**
 * Moves a list item to the top of its list (before the first item at the same level)
 * Returns the new content, or null if the item can't be moved
 */
export function moveListItemToTop(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): string | null {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return null

  const firstItem = findFirstListItem(content, block)
  if (!firstItem) return null

  const currentContent = content.slice(block.start, block.end)

  // Detect separator pattern between items (for loose lists, this includes blank lines)
  const secondItem = findNextListItem(content, firstItem)
  const separator = secondItem ? content.slice(firstItem.end, secondItem.start) : ""

  // Get all items from first to before current (including any separators between them)
  const itemsBeforeCurrent = content.slice(firstItem.start, block.start)

  // Handle trailing newline and separator cases
  let adjustedCurrentContent = currentContent
  let adjustedItemsBeforeCurrent = itemsBeforeCurrent

  if (!currentContent.endsWith("\n")) {
    // Current was last item without trailing newline
    adjustedCurrentContent = currentContent + "\n"
    // Remove trailing newline from items before since the moved item will now be last
    if (adjustedItemsBeforeCurrent.endsWith("\n")) {
      adjustedItemsBeforeCurrent = adjustedItemsBeforeCurrent.slice(0, -1)
    }
  } else if (separator.length > 0) {
    // For loose lists: add separator after current, remove trailing separator from items before
    adjustedCurrentContent = currentContent + separator
    // Remove the trailing separator from itemsBeforeCurrent
    if (itemsBeforeCurrent.endsWith(separator + "\n") || itemsBeforeCurrent.endsWith(separator)) {
      const trimLength = itemsBeforeCurrent.endsWith(separator + "\n")
        ? separator.length + 1
        : separator.length
      adjustedItemsBeforeCurrent = itemsBeforeCurrent.slice(
        0,
        itemsBeforeCurrent.length - trimLength,
      )
      // Ensure it ends with a newline
      if (!adjustedItemsBeforeCurrent.endsWith("\n")) {
        adjustedItemsBeforeCurrent += "\n"
      }
    }
  }

  const afterContent = content.slice(block.end)

  return (
    content.slice(0, firstItem.start) +
    adjustedCurrentContent +
    adjustedItemsBeforeCurrent +
    afterContent
  )
}

/**
 * Moves a list item to the bottom of its list (after the last item at the same level)
 * Returns the new content, or null if the item can't be moved
 */
export function moveListItemToBottom(
  content: string,
  nodeStartOffset: number,
  nodeEndOffset: number,
): string | null {
  const block = getListItemBlock(content, nodeStartOffset, nodeEndOffset)
  if (!block) return null

  const lastItem = findLastListItem(content, block)
  if (!lastItem) return null

  const currentContent = content.slice(block.start, block.end)
  const lastContent = content.slice(lastItem.start, lastItem.end)

  // Detect separator pattern between items (for loose lists, this includes blank lines)
  const nextItem = findNextListItem(content, block)
  const separator = nextItem ? content.slice(block.end, nextItem.start) : ""

  // Get the content from after current block to end of last item (all items that should come before current)
  const itemsAfterCurrent = content.slice(block.end, lastItem.end)

  // Handle case where last item doesn't end with newline
  let adjustedCurrentContent = currentContent
  let adjustedItemsAfterCurrent = itemsAfterCurrent

  if (!lastContent.endsWith("\n")) {
    // Last item has no trailing newline, so moved item shouldn't either
    if (adjustedCurrentContent.endsWith("\n")) {
      adjustedCurrentContent = adjustedCurrentContent.slice(0, -1)
    }
    // Add newline to items after so there's separation before moved item
    adjustedItemsAfterCurrent = itemsAfterCurrent + "\n"
  } else if (separator.length > 0) {
    // For loose lists: remove leading separator from itemsAfterCurrent and add separator before moved item
    if (itemsAfterCurrent.startsWith(separator)) {
      adjustedItemsAfterCurrent = itemsAfterCurrent.slice(separator.length)
    }
    // Add separator before the moved item (after the last item that's now second-to-last)
    adjustedItemsAfterCurrent = adjustedItemsAfterCurrent + separator
  }

  return (
    content.slice(0, block.start) +
    adjustedItemsAfterCurrent +
    adjustedCurrentContent +
    content.slice(lastItem.end)
  )
}
