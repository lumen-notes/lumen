# Lumen

> **Warning**: Work in progress

A system for thinking, writing, learning, and mindfulness.

[uselumen.com](https://uselumen.com)

## Note syntax

Lumen supports [GitHub Flavored Markdown](https://github.github.com/gfm/) with a few additional syntax extensions:

### Note links

```
[[<note-id>|<link-text>]]
```

| Example | Rendered HTML |
| :-- | :-- |
| `[[123456\|click me]]` | `<a href="/123456">click me</a>` |

### Date links

```
[[YYYY-MM-DD]]
```

| Example | Rendered HTML |
| :-- | :-- |
| `[[2021-07-11]]` | `<a href="/dates/2021-07-11">Sun, Jul 11, 2021</a>` |

### Tag links

```
#<tag>
```

| Example | Rendered HTML |
| :-- | :-- |
| `#recipe` | `<a href="/tags/recipe">#recipe</a>` |


## Keyboard shortcuts

| Action              | Shortcut                  |
| ------------------- | ------------------------- |
| Toggle command menu | <kbd>⌘</kbd> <kbd>K</kbd> |

**With focus inside a panel...**

| Action      | Shortcut                  |
| ----------- | ------------------------- |
| Close panel | <kbd>⌘</kbd> <kbd>X</kbd> |

**With focus inside a note card...**

| Action                | Shortcut                               |
| --------------------- | -------------------------------------- |
| Open note action menu | <kbd>⌘</kbd> <kbd>.</kbd>              |
| Edit note             | <kbd>E</kbd>                           |
| Copy note markdown    | <kbd>⌘</kbd> <kbd>C</kbd>              |
| Copy note ID          | <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>C</kbd> |
| Delete note           | <kbd>⌘</kbd> <kbd>⌫</kbd>              |
