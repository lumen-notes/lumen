# Templates

Any note can be turned into a template by adding a `template` key to the note's [frontmatter](/docs/metadata.md) with metadata about the template.

Here's an example "Book" template:

```
---
template:
  name: Book
author:
isbn:
recommended_by:
---

#

#book
```

To use this template, create a new note and type `/`. A list of available templates will appear. Select the Book template and press `Enter` to insert the contents of the template into your new note.

## EJS

Templates are rendered using [EJS](https://ejs.co/), a simple templating language that lets you embed JavaScript in your templates.

Here's how you could use EJS to include the current date in our Book template:

```
---
template:
  name Book
author:
isbn:
recommended_by:
date_saved: '<%= date %>'
---

#

#book
```

When you use this template, the `<%= date %>` placeholder will be replaced with the current date in `[[YYYY-MM-DD]]` format.

### Global variables

The following global variables are available in all templates:

| Name   | Type     | Description                                                                                                                              |
| :----- | :------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| `date` | `string` | The current date in `[[YYYY-MM-DD]]` format. For more details on the date format, see [Date links](/docs/markdown-syntax.md#date-links). |

## Inputs

You can specify inputs for your template by adding an `inputs` key to the template's metadata. Each input is an object with the following properties:

| Name          | Type       | Required | Description                                                                                                                                |
| :------------ | :--------- | :------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`        | `'string'` | Yes      | The type of the input. Currently, only `'string'` is supported.                                                                            |
| `required`    | `boolean`  | No       | Whether the input is required. If `true`, the user will not be able to insert the template until they have provided a value for the input. |
| `default`     | `string`   | No       | The default value for the input.                                                                                                           |
| `description` | `string`   | No       | A description of the input.                                                                                                                |

These are inputs are added to the variables available in the template. For example, here's how you might add an `author` input to your Book template:

```
---
template:
  name: Book
    inputs:
      author:
        type: string
author: '<%= author %>'
isbn:
recommended_by:
date_saved: '<%= date %>'
---

#

#book
```

When you use this template, you'll be prompted to provide a value for the `author` variable.

## Cursor position

You can specify where the cursor should be placed after the template is inserted by adding a `{cursor}` placeholder to the template. For example:

```
---
template:
  name: Book
    inputs:
      author:
        type: string
author: '<%= author %>'
isbn:
recommended_by:
date_saved: '<%= date %>'
---

# {cursor}

#book
```

> **Note**: Only one `{cursor}` placeholder is supported per template.
