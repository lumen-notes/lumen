/**
 * Escapes HTML entities to prevent XSS attacks.
 * Escapes <, >, &, ", and ' characters.
 */
export function getHtmlEscaped(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
