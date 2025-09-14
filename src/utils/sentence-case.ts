import { sentenceCase as _sentenceCase } from "change-case"

export function sentenceCase(key: string) {
  switch (key) {
    case "isbn":
      return "ISBN"
    case "id":
      return "ID"
    case "github":
      return "GitHub"
    default:
      return _sentenceCase(key)
  }
}
