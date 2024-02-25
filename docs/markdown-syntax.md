# Markdown syntax

Lumen supports [GitHub Flavored Markdown](https://github.github.com/gfm/) with the following syntax extensions:

## Wikilinks

Link to another note using its ID.

```
[[<note-id>|<link-text>]]
```

| Example                           | Rendered HTML                               |
| :-------------------------------- | :------------------------------------------ |
| `[[1652342106359\|Randie Bemis]]` | `<a href="/1652342106359">Randie Bemis</a>` |

### Dates

You can also use wikilink syntax to reference a date.

```
[[YYYY-MM-DD]]
```

| Example          | Rendered HTML                                 |
| :--------------- | :-------------------------------------------- |
| `[[2021-07-11]]` | `<a href="/2021-07-11">Sun, Jul 11, 2021</a>` |

> [!TIP]
> Lumen uses [Chrono](https://github.com/wanasit/chrono) to convert natural language dates into ISO format (YYYY-MM-DD). Try typing `[[yesterday]]` or `[[next monday]]` in a note editor to see it in action.

## Embeds

Embed the contents of another note using its ID.

```
![[<note-id>]]
```

| Example              | Rendered HTML                  |
| :------------------- | :----------------------------- |
| `![[1652342106359]]` | Contents of note 1652342106359 |

## Tags

Link to all other notes with the same tag.

```
#<tag-name>
```

> [!NOTE]
> Tag names must start with a letter and can contain letters, numbers, hyphens, underscores, and forward slashes.

| Example   | Rendered HTML                        |
| :-------- | :----------------------------------- |
| `#recipe` | `#<a href="/tags/recipe">recipe</a>` |
