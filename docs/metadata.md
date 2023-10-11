# Metadata

You can include metadata, in the form of key-value pairs ([YAML](https://yaml.org/)), at the top of any note, enclosed within `---` delimiters. We refer to this as your note's "frontmatter".

## Example

In the following note, we've included two pieces of metadata in the frontmatter: the book's ISBN and whether or not we've read it.

```
---
isbn: 978-1542866507
read: true
---

# How to Take Smart Notes

...
```

## Recognized keys

Frontmatter can contain any valid YAML key-value pairs. However, there are a few keys that Lumen recognizes and uses to enhance the user interface:

| Key         | Description                        | Enhancements                                                                                                                            |
| :---------- | :--------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `phone`     | Phone number                       | Adds a phone link.                                                                                                                      |
| `email`     | Email address                      | Adds an email link.                                                                                                                     |
| `address`   | Physical address                   | Adds a link to Google Maps.                                                                                                             |
| `birthday`  | Birthday (`YYYY-MM-DD` or `MM-DD`) | Displays time until the next birthday.                                                                                                  |
| `github`    | GitHub username                    | Adds a link to the GitHub profile.                                                                                                      |
| `twitter`   | Twitter username                   | Adds a link to the Twitter profile.                                                                                                     |
| `youtube`   | YouTube username                   | Adds a link to the YouTube channel.                                                                                                     |
| `instagram` | Instagram username                 | Adds a link to the Instagram profile.                                                                                                   |
| `isbn`      | Book ISBN-10 or ISBN-13            | Adds an image of the book cover and an [Open Library](https://openlibrary.org/) link to the top of the note.                            |
| `template`  | Template name                      | Turn the note into a template with the given name. For more details on templates, see [Templates](/docs/templates.md).                  |
| `tags`      | List of tag names                  | Adds the given tags to the note. This is an alternative to using [`#tag` syntax](/docs/markdown-syntax.md#note-links) in the note body. |
