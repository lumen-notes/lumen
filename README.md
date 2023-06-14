> **Warning**: Work in progress. Expect frequent breaking changes. See the [project board](https://github.com/orgs/lumen-notes/projects/2) for progress updates.

# Lumen

![Status](https://badgen.net/badge/status/alpha/orange)

A note-taking app for lifelong learners. Based on the [Zettelkasten Method](https://zettelkasten.de/introduction/).

![Screenshot of the app](https://user-images.githubusercontent.com/4608155/213857201-286bee23-205c-4fbd-b962-22b789c38426.png)

## Links

| Name             | URL                                                                 | Status                                                                                                                                                               |
| :--------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🌐 Website       | [uselumen.com](https://uselumen.com)                                | [![Netlify Status](https://api.netlify.com/api/v1/badges/9e55f1c2-783d-4abb-9fa2-edc59f8aa0c3/deploy-status)](https://app.netlify.com/sites/lumen-notes/deploys)     |
| 🛠️ Design system | [lumen-storybook.netlify.app](https://lumen-storybook.netlify.app/) | [![Netlify Status](https://api.netlify.com/api/v1/badges/acd80077-43c2-4292-8721-6f77e633a896/deploy-status)](https://app.netlify.com/sites/lumen-storybook/deploys) |
| 🐣 Twitter       | [@lumen_notes](https://twitter.com/lumen_notes)                     |                                                                                                                                                                      |

## Strong opinions, weakly held

- Knowledge management and task management should be separate. Lumen is a tool for knowledge management not task management.
- Notes should be stored in [plain text files](https://sive.rs/plaintext) to ensure portability and longevity.
- Notes should be atomic and densely linked.
- Notes should be accessible while offline.
- Notes should be version controlled.
- Notes should be stored in a flat directory structure to avoid premature hierarchy. Links between notes create hierarchy organically.

## Getting started

1. Create a new GitHub repository to store your notes in using the [template repository](https://github.com/lumen-notes/lumen-template).
1. Generate a GitHub [personal access token](https://github.com/settings/tokens/new) with `repo` access.
1. Paste your personal access token and repository details into Lumen's [settings page](https://uselumen.com/settings).

## Markdown syntax

Lumen supports [GitHub Flavored Markdown](https://github.github.com/gfm/) with the following syntax extensions:

### Note links

Link to another note using its ID.

```
[[<note-id>|<link-text>]]
```

| Example                           | Rendered HTML                               |
| :-------------------------------- | :------------------------------------------ |
| `[[1652342106359\|Randie Bemis]]` | `<a href="/1652342106359">Randie Bemis</a>` |

### Date links

Link to all other notes that reference the same date.

```
[[YYYY-MM-DD]]
```

| Example          | Rendered HTML                                       |
| :--------------- | :-------------------------------------------------- |
| `[[2021-07-11]]` | `<a href="/dates/2021-07-11">Sun, Jul 11, 2021</a>` |

### Tag links

Link to all other notes with the same tag.

```
#<tag-name>
```

> **Note**: Tag names must start with a letter and can contain letters, numbers, hyphens, underscores, and forward slashes.

| Example   | Rendered HTML                        |
| :-------- | :----------------------------------- |
| `#recipe` | `<a href="/tags/recipe">#recipe</a>` |

## Metadata

You can include metadata, in the form of key-value pairs ([YAML](https://yaml.org/)), at the top of any note, enclosed within `---` delimiters. We refer to this as your note's "frontmatter".

### Example

In the following note, we've included two pieces of metadata in the frontmatter: the book's ISBN and whether or not we've read it.

```
---
ibsn: 978-1542866507
read: true
---

# How to Take Smart Notes

...
```

### Recognized keys

Frontmatter can contain any valid YAML key-value pairs. However, there are a few keys that Lumen recognizes and uses to enhance the user interface.

| Key         | Description                        | Enhancements                                                                                                 |
| :---------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `phone`     | Phone number                       | Adds a phone link.                                                                                           |
| `email`     | Email address                      | Adds an email link.                                                                                          |
| `website`   | Website URL                        | Adds a link to the website.                                                                                  |
| `address`   | Physical address                   | Adds a link to Google Maps.                                                                                  |
| `birthday`  | Birthday (`YYYY-MM-DD` or `MM-DD`) | Displays time until the next birthday.                                                                       |
| `github`    | GitHub username                    | Adds a link to the GitHub profile.                                                                           |
| `twitter`   | Twitter username                   | Adds a link to the Twitter profile.                                                                          |
| `youtube`   | YouTube username                   | Adds a link to the YouTube channel.                                                                          |
| `instagram` | Instagram username                 | Adds a link to the Instagram profile.                                                                        |
| `isbn`      | Book ISBN-10 or ISBN-13            | Adds an image of the book cover and an [Open Library](https://openlibrary.org/) link to the top of the note. |

## Query language

Search your notes with Lumen's [GitHub-style](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) query language. Here's how it works:

- A search query can contain any combination of qualifiers, which are key-value pairs separated by spaces. For example, `tag:log date:2021-07-11` matches notes with the `log` tag AND the date `2021-07-11`.
- To exclude notes matching a qualifier, prefix the qualifier with a hyphen. For example, `-tag:log` matches notes that do not have the `log` tag.
- To include multiple values in a qualifier, separate the values with commas. For example, `tag:article,book` matches notes with either the `article` OR `book` tag.
- Qualifiers can also be used to filter notes based on numerical ranges. To do this, use one of the following operators before the qualifier value: `>`, `<`, `>=`, `<=`. For example, `backlinks:>10` matches notes with more than 10 backlinks; `date:>=2021-01-01` matches notes with a date on or after `2021-01-01`.
- Text outside of qualifiers is used to fuzzy search the note's title and body. For example, `tag:recipe cookie` matches notes with the `recipe` tag that also contain the word "cookie" in the title or body.

### Qualifiers

| Key         | Example                                                                                           |
| :---------- | :------------------------------------------------------------------------------------------------ |
| `id`        | `id:1652342106359` matches the note with ID `1652342106359`.                                      |
| `tag`       | `tag:recipe` matches notes with the `recipe` tag.                                                 |
| `tags`      | `tags:>1` matches notes with more than one tag.                                                   |
| `date`      | `date:2021-07-11` matches notes with the date `2021-07-11`.                                       |
| `dates`     | `dates:>1` matches notes with more than one date.                                                 |
| `link`      | `link:1652342106359` matches notes that link to the note with ID `1652342106359`.                 |
| `links`     | `links:>1` matches notes with more than one link.                                                 |
| `backlink`  | `backlink:1652342106359` matches notes that are linked to by the note with ID `1652342106359`.    |
| `backlinks` | `backlinks:>1` matches notes with more than one backlink.                                         |
| `no`        | `no:tag` matches notes without a tag. `no` can be used with any qualifier key or frontmatter key. |

Unrecognized qualifier keys are assumed to be frontmatter keys. For example, `read:true` matches notes with `read: true` in their frontmatter.

## Keyboard shortcuts

| Action                 | Shortcut                                            |
| ---------------------- | --------------------------------------------------- |
| Toggle command menu    | <kbd>⌘</kbd> <kbd>K</kbd>                           |
| Toggle new note dialog | <kbd>⌘</kbd> <kbd>I</kbd>                           |
| Focus first panel      | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>⌥</kbd> <kbd>←</kbd> |
| Focus previous panel   | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>←</kbd>              |
| Focus next panel       | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>→</kbd>              |
| Focus last panel       | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>⌥</kbd> <kbd>→</kbd> |

**With focus inside the new note dialog...**

| Action       | Shortcut                      |
| ------------ | ----------------------------- |
| Create note  | <kbd>⌘</kbd> <kbd>Enter</kbd> |
| Close dialog | <kbd>Esc</kbd>                |

**With focus inside a panel...**

| Action              | Shortcut                                            |
| ------------------- | --------------------------------------------------- |
| Focus search input  | <kbd>⌘</kbd> <kbd>F</kbd>                           |
| Close panel         | <kbd>⌘</kbd> <kbd>X</kbd>                           |
| Focus first note    | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>⌥</kbd> <kbd>↑</kbd> |
| Focus previous note | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>↑</kbd>              |
| Focus next note     | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>↓</kbd>              |
| Focus last note     | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>⌥</kbd> <kbd>↓</kbd> |

**With focus inside a note card...**

| Action                | Shortcut                               |
| --------------------- | -------------------------------------- |
| Open note action menu | <kbd>⌘</kbd> <kbd>.</kbd>              |
| Edit note             | <kbd>E</kbd>                           |
| Copy note markdown    | <kbd>⌘</kbd> <kbd>C</kbd>              |
| Copy note ID          | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>C</kbd> |
| Delete note           | <kbd>⌘</kbd> <kbd>⌫</kbd>              |

## Related

- [How To Take Smart Notes by Sönke Ahrens](https://takesmartnotes.com/)
- [Introduction to the Zettelkasten Method](https://zettelkasten.de/introduction/)
- [Andy Matuschak's notes](https://notes.andymatuschak.org/)
- [Obsidian](https://obsidian.md/)
- [Logseq](https://logseq.com/)
- [Roam Research](https://roamresearch.com)
