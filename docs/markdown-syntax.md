# Markdown syntax

Lumen supports [GitHub Flavored Markdown](https://github.github.com/gfm/) with the following syntax extensions:

## Note links

Link to another note using its ID.

```
[[<note-id>|<link-text>]]
```

| Example                           | Rendered HTML                               |
| :-------------------------------- | :------------------------------------------ |
| `[[1652342106359\|Randie Bemis]]` | `<a href="/1652342106359">Randie Bemis</a>` |

## Note embeds

Embed the contents of another note using its ID.

```
![[<note-id>]]
```

| Example              | Rendered HTML                  |
| :------------------- | :----------------------------- |
| `![[1652342106359]]` | Contents of note 1652342106359 |

## Date links

Link to all other notes that reference the same date.

```
[[YYYY-MM-DD]]
```

| Example          | Rendered HTML                                               |
| :--------------- | :---------------------------------------------------------- |
| `[[2021-07-11]]` | `<a href="/calendar?date=2021-07-11">Sun, Jul 11, 2021</a>` |

## Tag links

Link to all other notes with the same tag.

```
#<tag-name>
```

> **Note**: Tag names must start with a letter and can contain letters, numbers, hyphens, underscores, and forward slashes.

| Example   | Rendered HTML                        |
| :-------- | :----------------------------------- |
| `#recipe` | `#<a href="/tags/recipe">recipe</a>` |
