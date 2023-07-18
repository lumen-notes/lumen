# Query language

Search your notes with Lumen's [GitHub-style](https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests) query language. Here's how it works:

- A search query can contain any combination of qualifiers, which are key-value pairs separated by spaces. For example, `tag:log date:2021-07-11` matches notes with the `log` tag AND the date `2021-07-11`.
- To exclude notes matching a qualifier, prefix the qualifier with a hyphen. For example, `-tag:log` matches notes that do not have the `log` tag.
- To include multiple values in a qualifier, separate the values with commas. For example, `tag:article,book` matches notes with either the `article` OR `book` tag.
- Qualifiers can also be used to filter notes based on numerical ranges. To do this, use one of the following operators before the qualifier value: `>`, `<`, `>=`, `<=`. For example, `backlinks:>10` matches notes with more than 10 backlinks; `date:>=2021-01-01` matches notes with a date on or after `2021-01-01`.
- Text outside of qualifiers is used to fuzzy search the note's title and body. For example, `tag:recipe cookie` matches notes with the `recipe` tag that also contain the word "cookie" in the title or body.

## Qualifiers

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
