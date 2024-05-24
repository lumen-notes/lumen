import { Form, ActionPanel, Action, showToast, AI } from "@raycast/api";
import fetch from "node-fetch";
import { useState } from "react";

type Values = {
  textfield: string;
  textarea: string;
  datepicker: Date;
  checkbox: boolean;
  dropdown: string;
  tokeneditor: string[];
};

// TODO: Add UI for managing templates
const templates = [
  {
    id: "book",
    title: "Book",
    template: `---
tags: [reference, book]
isbn: <ai>ISBN 13 of the book</ai>
author: <ai>Author of the book</ai>
---

# <ai>Title of the book (excluding subtitle)</ai>

- <ai>One-liner description of the book</ai>`,
  },
  {
    id: "article",
    title: "Article",
    template: `---
tags: [reference, article]
# Suggested tags: <ai>1-3 short tag suggestions based on the content of the article in lowercase. Use kebab-case if the tag is more than one word. A tag should be no more than two words.</ai>
author: <ai>Author of the article</ai>
---

# [<ai>Title of the article</ai>](<ai>URL of the article</ai>)

- <ai>One-liner description of the article</ai>`,
  },
  {
    id: "app",
    title: "App",
    template: `---
tags: [reference, app]
---

# [<ai>Name of the app</ai>](<ai>URL of the app landing page</ai>)

- <ai>One-liner description of the app</ai>`,
  },
];

export default function Command() {
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(values: Values) {
    console.log(values);
    showToast({ title: "Submitted form", message: "See logs for submitted values" });
  }

  return (
    <>
      <Form
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <Action.SubmitForm onSubmit={handleSubmit} />
          </ActionPanel>
        }
      >
        <Form.TextField
          id="url"
          title="URL"
          placeholder="https://example.com"
          autoFocus
          onChange={async (url) => {
            // If value is not a valid HTTP URL, return early
            const urlRegex = new RegExp("^(http|https)://", "i");
            if (!urlRegex.test(url)) {
              return;
            }

            setIsLoading(true);

            const response = await fetch(`https://r.jina.ai/${url}`);

            if (!response.ok) {
              // TODO: Handle error
              return;
            }

            const text = await response.text();

            // TODO: Add a dropdown to manually select a template if the AI choice is incorrect
            const answer = await AI.ask(
              `You will be provided with a list of note templates and a text representation of a webpage. Your task is to choose the most relavant template based on the content of the webpage and fill in that template with details from the webpage. Do not repond with anything expect the filled in content of the template.\n\n${JSON.stringify(templates)}\n\n${text}`,
              {
                // TODO: Allow users to select the model
                // @ts-expect-error gpt-4o is supported
                model: "openai-gpt-4o",
              },
            );

            setNoteContent(answer);
            setIsLoading(false);
          }}
        />

        <Form.Separator />
        {/* <Form.Dropdown id="template" title="Template">
          <Form.Dropdown.Item value="dropdown-item" title="Dropdown Item" />
        </Form.Dropdown> */}
        <Form.TextArea id="note-content" title="Note" value={noteContent} />
      </Form>
    </>
  );
}
