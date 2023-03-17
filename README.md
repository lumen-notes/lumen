> **Warning**: Work in progress. Expect frequent breaking changes. See the [project board](https://github.com/orgs/lumen-notes/projects/2) for progress updates.

# Lumen

An opinionated note-taking system for thinking, writing, learning, and mindfulness. Built for personal usage. Based on the [Zettelkasten Method](https://zettelkasten.de/introduction/).

![Screenshot of the app](https://user-images.githubusercontent.com/4608155/213857201-286bee23-205c-4fbd-b962-22b789c38426.png)

## Links

| Name      | URL                                                                 | Status                                                                                                                                                               |
| :-------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Website   | [uselumen.com](https://uselumen.com)                                | [![Netlify Status](https://api.netlify.com/api/v1/badges/9e55f1c2-783d-4abb-9fa2-edc59f8aa0c3/deploy-status)](https://app.netlify.com/sites/lumen-notes/deploys)     |
| Storybook | [lumen-storybook.netlify.app](https://lumen-storybook.netlify.app/) | [![Netlify Status](https://api.netlify.com/api/v1/badges/acd80077-43c2-4292-8721-6f77e633a896/deploy-status)](https://app.netlify.com/sites/lumen-storybook/deploys) |

## Strong opinions, weakly held

- Knowledge management and task management should be separate. Lumen is a system for knowledge management not task management.
- Notes should be stored in [plain text files](https://sive.rs/plaintext) to ensure portability and longevity.
- Notes should be atomic and densely linked.
- Notes should be accessible while offline.
- Notes should be version controlled.
- Notes should be stored in a flat directory structure to avoid premature hierarchy. Links between notes create hierarchy organically.

## Getting started

1. Create a new GitHub repository to store your notes in using the [template repository](https://github.com/lumen-notes/lumen-template).
1. Generate a GitHub [personal access token](https://github.com/settings/tokens/new) with `repo` access.
1. Paste your personal access token and repository details into Lumen's [settings page](https://uselumen.com/settings).

## Syntax

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

> **Note**: Tag names must start with a letter and can contain letters, numbers, hyphens, and underscores.

| Example   | Rendered HTML                        |
| :-------- | :----------------------------------- |
| `#recipe` | `<a href="/tags/recipe">#recipe</a>` |

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
