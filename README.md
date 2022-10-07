# Lumen

> **Warning**: Work in progress

An opinionated* system for thinking, writing, learning, and mindfulness.

[uselumen.com](https://uselumen.com)

## *Opinions

- Each note in Lumen should be limited to one idea.
- Lumen is not a task manager. 

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

| Example   | Rendered HTML                        |
| :-------- | :----------------------------------- |
| `#recipe` | `<a href="/tags/recipe">#recipe</a>` |

## Keyboard shortcuts

| Action              | Shortcut                  |
| ------------------- | ------------------------- |
| Toggle command menu | <kbd>⌘</kbd> <kbd>K</kbd> |

**With focus inside a panel...**

| Action             | Shortcut                  |
| ------------------ | ------------------------- |
| Focus search input | <kbd>⌘</kbd> <kbd>F</kbd> |
| Close panel        | <kbd>⌘</kbd> <kbd>X</kbd> |

**With focus inside a note card...**

| Action                | Shortcut                               |
| --------------------- | -------------------------------------- |
| Open note action menu | <kbd>⌘</kbd> <kbd>.</kbd>              |
| Edit note             | <kbd>E</kbd>                           |
| Copy note markdown    | <kbd>⌘</kbd> <kbd>C</kbd>              |
| Copy note ID          | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>C</kbd> |
| Delete note           | <kbd>⌘</kbd> <kbd>⌫</kbd>              |
