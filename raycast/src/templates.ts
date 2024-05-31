export type Template = {
  id: string;
  title: string;
  template: string;
};

// TODO: Add UI for managing templates
export const templates: Record<string, Template> = {
  default: {
    id: "default",
    title: "Default",
    template: `---
tags: [reference]
date_saved: <%= date %>
---

# [<ai>Title of the page</ai>](<ai>URL of the page</ai>)

- <ai>One-liner description of the page</ai>`,
  },
  book: {
    id: "book",
    title: "Book",
    template: `---
tags: [reference, book]
# Suggested tags: <ai>1-3 short tag suggestions based on the content of the book in lowercase. A tag should be no more than two words. Use kebab-case if the tag is more than one word.</ai>
date_saved: <%= date %>
subtitle: <ai>Subtitle of the book</ai>
author: <ai>Author of the book</ai>
isbn: <ai>ISBN 13 of the book</ai>
---

# <ai>Title of the book (excluding subtitle)</ai>

- <ai>One-liner description of the book</ai>`,
  },
  article: {
    id: "article",
    title: "Article",
    template: `---
tags: [reference, article]
# Suggested tags: <ai>1-3 short tag suggestions based on the content of the article in lowercase. A tag should be no more than two words. Use kebab-case if the tag is more than one word.</ai>
date_saved: <%= date %>
author: <ai>Author of the article</ai>
---

# [<ai>Title of the article</ai>](<ai>URL of the article</ai>)

- <ai>One-liner description of the article</ai>`,
  },
  app: {
    id: "app",
    title: "App",
    template: `---
tags: [reference, app]
date_saved: <%= date %>
---

# [<ai>Name of the app</ai>](<ai>URL of the app landing page</ai>)

- <ai>One-liner description of the app</ai>`,
  },
};
