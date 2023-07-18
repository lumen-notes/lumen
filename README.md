> **Warning**: Experimental. Expect frequent breaking changes. See the [project board](https://github.com/orgs/lumen-notes/projects/2) for progress updates.

# Lumen

Lumen is a note-taking app for lifelong learners.

[**Get started →**](#getting-started)

![Screenshot of the app (light)](https://user-images.githubusercontent.com/4608155/254137283-bf5a5822-d4fb-4d86-ad4f-d2c7f3b19607.png#gh-light-mode-only)

![Screenshot of the app (dark)](https://user-images.githubusercontent.com/4608155/254137649-da61fd2c-dbb2-4e9e-b50a-3f9da1f23337.png#gh-dark-mode-only)

<br>

Think of Lumen as your private [digital garden](https://maggieappleton.com/garden-history). It's where you plant, grow, and harvest ideas.

| 🌱 Plant | 🌿 Grow | 🌻 Harvest |
| :--- | :--- | :--- |
| Write notes with [Markdown syntax](#markdown-syntax) and store them as plain text files in a GitHub repository of your choice. You own your data, forever. | Connect your notes with links and tags. Lumen makes it easy to traverse your knowledge graph and discover surpising new connections. | Access your notes from anywhere—even offline. Use Lumen's flexible [query language](#query-language) to find exactly what you're looking for. |

<br>

_Notes in Lumen are..._

- atomic
- interconnected
- written in Markdown
- stored as files on GitHub
- version-controlled with Git
- searchable
- available offline
- accessible on any device

<br>

## Getting started

1. Create a new GitHub repository to store your notes in using the [template repository](https://github.com/lumen-notes/lumen-template).
1. Generate a GitHub [personal access token](https://github.com/settings/tokens/new) with `repo` access.
1. Paste your personal access token and repository details into Lumen's [settings page](https://uselumen.com/settings).

<br>

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

<br>

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

Frontmatter can contain any valid YAML key-value pairs. However, there are a few keys that Lumen recognizes and uses to enhance the user interface:

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
| `template`  | Template name                      | Turn the note into a template with the given name.                                                           |

<br>

## Templates

Any note can be turned into a template by adding a `template` key to the note's [frontmatter](#metadata) with the name of the template as the value.

Here's an example "Book" template:

```
---
template: Book
author:
isbn:
recommended_by:
---

#
```

To use this template, create a new note and type `/`. A list of available templates will appear. Select the Book template and press `Enter` to insert the contents of the template into your new note.

### EJS

Templates are rendered using [EJS](https://ejs.co/), a simple templating language that lets you embed JavaScript in your templates.

Here's how we could use EJS to include the current date in our Book template:

```
---
template: Book
author:
isbn:
recommended_by:
date_saved: '<%= date %>'
---

#

```

When we use this template, the `<%= date %>` placeholder will be replaced with the current date in `[[YYYY-MM-DD]]` format.

#### Global variables

The following global variables are available in all templates:

| Name   | Type     | Description                                                                      |
| :----- | :------- | :------------------------------------------------------------------------------- |
| `date` | `string` | The current date in `[[YYYY-MM-DD]]` format. See also: [Date links](#date-links) |

### Cursor position

You can specify where the cursor should be placed after the template is inserted by adding a `{cursor}` placeholder to the template. For example:

```
---
template: Book
author:
isbn:
recommended_by:
date_saved: '<%= date %>'
---

# {cursor}
```

> **Note**: Only one `{cursor}` placeholder is supported per template.

<br>

## Query language

Search your notes with Lumen's [GitHub-style](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) query language. Here's how it works:

- A search query can contain any combination of qualifiers, which are key-value pairs separated by spaces. For example, `tag:log date:2021-07-11` matches notes with the `log` tag AND the date `2021-07-11`.
- To exclude notes matching a qualifier, prefix the qualifier with a hyphen. For example, `-tag:log` matches notes that do not have the `log` tag.
- To include multiple values in a qualifier, separate the values with commas. For example, `tag:article,book` matches notes with either the `article` OR `book` tag.
- Qualifiers can also be used to filter notes based on numerical ranges. To do this, use one of the following operators before the qualifier value: `>`, `<`, `>=`, `<=`. For example, `backlinks:>10` matches notes with more than 10 backlinks; `date:>=2021-01-01` matches notes with a date on or after `2021-01-01`.
- Text outside of qualifiers is used to fuzzy search the note's title and body. For example, `tag:recipe cookie` matches notes with the `recipe` tag that also contain the word "cookie" in the title or body.

### Qualifiers

| Key         | Example                                                                                                                                    |
| :---------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `id`        | `id:1652342106359` matches the note with ID `1652342106359`.                                                                               |
| `tag`       | `tag:recipe` matches notes with the `recipe` tag.                                                                                          |
| `tags`      | `tags:>1` matches notes with more than one tag.                                                                                            |
| `date`      | `date:2021-07-11` matches notes with the date `2021-07-11`.                                                                                |
| `dates`     | `dates:>1` matches notes with more than one date.                                                                                          |
| `link`      | `link:1652342106359` matches notes that link to the note with ID `1652342106359`.                                                          |
| `links`     | `links:>1` matches notes with more than one link.                                                                                          |
| `backlink`  | `backlink:1652342106359` matches notes that are linked to by the note with ID `1652342106359`.                                             |
| `backlinks` | `backlinks:>1` matches notes with more than one backlink.                                                                                  |
| `no`        | `no:tag` matches notes without a tag. `no` can be used with any qualifier key or frontmatter key.                                          |
| `has`       | `has:tag` matches notes with one or more tag. `has` can be used with any qualifier key or frontmatter key. `has` and `-no` are equivalent. |

Unrecognized qualifier keys are assumed to be frontmatter keys. For example, `read:true` matches notes with `read: true` in their frontmatter.

<br>

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

<br>

## Links

| Name             | URL                                                                 | Status                                                                                                                                                               |
| :--------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🌐 Website       | [uselumen.com](https://uselumen.com)                                | [![Netlify Status](https://api.netlify.com/api/v1/badges/9e55f1c2-783d-4abb-9fa2-edc59f8aa0c3/deploy-status)](https://app.netlify.com/sites/lumen-notes/deploys)     |
| 🛠️ Design system | [lumen-storybook.netlify.app](https://lumen-storybook.netlify.app/) | [![Netlify Status](https://api.netlify.com/api/v1/badges/acd80077-43c2-4292-8721-6f77e633a896/deploy-status)](https://app.netlify.com/sites/lumen-storybook/deploys) |
| 🐣 Twitter       | [@lumen_notes](https://twitter.com/lumen_notes)                     | 

<br>

## Recommended reading

- [How To Take Smart Notes by Sönke Ahrens](https://takesmartnotes.com/)
- [Introduction to the Zettelkasten Method](https://zettelkasten.de/introduction/)
- [Andy Matuschak's notes](https://notes.andymatuschak.org/)

<br>

## Alternatives

- [Obsidian](https://obsidian.md/)
- [Logseq](https://logseq.com/)
- [Roam Research](https://roamresearch.com)

