/**
 * Pure utility functions for reordering list items in markdown content
 */

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
 * Get the full list item block boundaries (including nested content).
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
 * Find the previous list item at the same indentation level.
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
 * Find the next list item at the same indentation level.
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
 * Check if a list item can be moved up.
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
 * Check if a list item can be moved down.
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
 * Move a list item up (swap with previous item).
 * Returns the new content, or null if the item can't be moved.
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

  return (
    content.slice(0, prevItem.start) +
    currentContent +
    separator +
    prevContent +
    content.slice(block.end)
  )
}

/**
 * Move a list item down (swap with next item).
 * Returns the new content, or null if the item can't be moved.
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

  return (
    content.slice(0, block.start) +
    nextContent +
    separator +
    currentContent +
    content.slice(nextItem.end)
  )
}
