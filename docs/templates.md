# Templates

Any note can be turned into a template by adding a `template` key to the note's [frontmatter](/docs/metadata.md) with the name of the template as the value.

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

## EJS

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

### Global variables

The following global variables are available in all templates:

| Name   | Type     | Description                                                                                                                              |
| :----- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| `date` | `string` | The current date in `[[YYYY-MM-DD]]` format. For more details on the date format, see [Date links](/docs/markdown-syntax.md#date-links). |

## Cursor position

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

<br>
